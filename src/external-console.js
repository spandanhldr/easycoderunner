'use strict';
const path = require('node:path');
const fs = require('node:fs/promises');
const { execFile, spawn } = require('node:child_process');
const { quote, shellQuote } = require('./runner');
const platformKey = platform => platform === 'win32' ? 'windows' : platform === 'darwin' ? 'macos' : ['freebsd', 'openbsd', 'netbsd', 'dragonfly'].includes(platform) ? 'bsd' : platform === 'linux' ? 'linux' : null;
const powershellPath = () => path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
function windowsArg(value) {
  if (!value.length || /[\s"]/.test(value)) return '"' + value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1') + '"';
  return value;
}
function appleQuote(value) { return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"'; }
function substitute(args, values) {
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('Custom terminal arguments must be an array of strings.');
  if (!args.some(arg => /\{(script|command|encodedScript)\}/.test(arg))) throw new Error('Custom terminal arguments must include {script}, {command}, or {encodedScript}.');
  return args.map(arg => arg.replace(/\{(script|command|encodedScript|cwd)\}/g, (_, key) => {
    if (values[key] === undefined) throw new Error('The {' + key + '} placeholder is unavailable on this operating system.');
    return values[key];
  }));
}
function buildTerminalPlan(platform, file, script, settings = {}, scriptFile) {
  const key = platformKey(platform);
  if (!key) throw new Error('Unsupported operating system: ' + platform);
  const defaults = { windows: 'powershell', macos: 'terminal', linux: 'xterm', bsd: 'xterm' };
  const terminal = settings.terminal || defaults[key];
  const cwd = (key === 'windows' ? path.win32 : path.posix).dirname(file);
  if (key === 'windows') {
    const paused = script + (settings.pauseAfterRun === false ? '' : "; Write-Host ''; Write-Host 'Press any key to close this window...'; $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')");
    const encodedScript = Buffer.from(paused, 'utf16le').toString('base64');
    const shell = powershellPath();
    const shellArgs = ['-NoLogo', '-NoProfile', '-OutputFormat', 'Text', '-EncodedCommand', encodedScript];
    const command = [shell, ...shellArgs].map(windowsArg).join(' ');
    switch (terminal) {
      case 'powershell': return { executable: shell, args: shellArgs, cwd };
      case 'pwsh': return { executable: 'pwsh.exe', args: shellArgs, cwd };
      case 'cmd': return { executable: 'cmd.exe', args: [], commandLine: '/d /s /c "' + command + '"', cwd };
      case 'windows-terminal': return { executable: 'wt.exe', args: ['-w', 'new', 'new-tab', '-d', cwd, shell, ...shellArgs], cwd };
      case 'custom':
        if (!settings.customPath) throw new Error('Set the Windows custom terminal path in EasyCodeRunner settings.');
        return { executable: settings.customPath, args: substitute(settings.customArgs || [], { script: scriptFile, command, encodedScript, cwd }), cwd };
      default: throw new Error('Unsupported Windows terminal: ' + terminal);
    }
  }
  if (!scriptFile) throw new Error('A generated script path is required.');
  const command = '/bin/sh ' + shellQuote(scriptFile);
  if (terminal === 'custom') {
    if (!settings.customPath) throw new Error('Set the custom terminal executable path in EasyCodeRunner settings.');
    return { executable: settings.customPath, args: substitute(settings.customArgs || [], { script: scriptFile, command, cwd }), cwd };
  }
  if (key === 'macos') {
    let appleScript;
    if (terminal === 'terminal') appleScript = 'tell application "Terminal"\nactivate\ndo script ' + appleQuote(command) + '\nend tell';
    else if (terminal === 'iterm2') appleScript = 'tell application "iTerm2"\nactivate\nset runWindow to (create window with default profile)\ntell current session of runWindow\nwrite text ' + appleQuote(command) + '\nend tell\nend tell';
    else throw new Error('Unsupported macOS terminal: ' + terminal);
    return { executable: '/usr/bin/osascript', args: ['-e', appleScript], cwd, wait: true };
  }
  const adapters = {
    'xterm': ['-e', '/bin/sh', scriptFile],
    'gnome-terminal': ['--', '/bin/sh', scriptFile],
    'konsole': ['-e', '/bin/sh', scriptFile],
    'xfce4-terminal': ['--disable-server', '--execute', '/bin/sh', scriptFile],
    'kitty': ['/bin/sh', scriptFile],
    'alacritty': ['-e', '/bin/sh', scriptFile]
  };
  if (!adapters[terminal]) throw new Error('Unsupported terminal: ' + terminal);
  return { executable: terminal, args: adapters[terminal], cwd };
}
function buildWindowsBootstrap(plan) {
  const argumentLine = plan.commandLine || plan.args.map(windowsArg).join(' ');
  return "$ErrorActionPreference = 'Stop'; Start-Process -FilePath " + quote(plan.executable) + ' -WorkingDirectory ' + quote(plan.cwd) + ' -WindowStyle Normal -ArgumentList ' + quote(argumentLine);
}
// Retained for the original launcher checks.
function buildLaunchScript(file, script) { return buildWindowsBootstrap(buildTerminalPlan('win32', file, script, { pauseAfterRun: false })); }
function execute(file, args, options) {
  return new Promise((resolve, reject) => execFile(file, args, options, (error, stdout, stderr) => {
    if (error) reject(new Error(stderr.trim() || error.message)); else resolve();
  }));
}
async function launchExternalConsole(file, script, settings = {}, storageDirectory) {
  const platform = settings.platform || process.platform;
  const key = platformKey(platform);
  if (!key) throw new Error('Unsupported operating system: ' + platform);
  let scriptFile;
  let runDirectory;
  // Unix terminals and custom Windows terminals may need a real script file.
  const customNeedsScript = settings.terminal === 'custom' && Array.isArray(settings.customArgs) && settings.customArgs.some(arg => arg.includes('{script}'));
  if (key !== 'windows' || customNeedsScript) {
    if (!storageDirectory) throw new Error('Extension storage is unavailable.');
    await fs.mkdir(storageDirectory, { recursive: true });
    runDirectory = await fs.mkdtemp(path.join(storageDirectory, 'run-'));
    scriptFile = path.join(runDirectory, key === 'windows' ? 'run.ps1' : 'run.sh');
    let content;
    if (key === 'windows') {
      content = script + (settings.pauseAfterRun === false ? '' : "; Write-Host 'Press any key to close...'; $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')") + '; Remove-Item -LiteralPath ' + quote(scriptFile) + '; Remove-Item -LiteralPath ' + quote(runDirectory);
    } else {
      // Run the inner script as a child so its exit does not skip the pause and cleanup.
      content = '#!/bin/sh\ntrap ' + shellQuote('rm -f -- ' + shellQuote(scriptFile) + '; rmdir -- ' + shellQuote(runDirectory)) + ' EXIT\n/bin/sh -c ' + shellQuote(script) + '\nstatus=$?\n';
      if (settings.pauseAfterRun !== false) content += "printf '\\nPress Enter to close this window...'; IFS= read -r answer </dev/tty\n";
      content += 'exit "$status"\n';
    }
    await fs.writeFile(scriptFile, content, { mode: 0o700 });
  }
  try {
    const plan = buildTerminalPlan(platform, file, script, settings, scriptFile);
    if (key === 'windows') {
      const bootstrap = Buffer.from(buildWindowsBootstrap(plan), 'utf16le').toString('base64');
      await execute(powershellPath(), ['-NoLogo', '-NoProfile', '-OutputFormat', 'Text', '-EncodedCommand', bootstrap], { windowsHide: true });
    } else if (plan.wait) {
      await execute(plan.executable, plan.args, { cwd: plan.cwd });
    } else {
      await new Promise((resolve, reject) => {
        const child = spawn(plan.executable, plan.args, { cwd: plan.cwd, detached: true, stdio: 'ignore' });
        child.once('error', reject);
        child.once('spawn', () => { child.unref(); resolve(); });
      });
    }
  } catch (error) {
    if (scriptFile) await fs.unlink(scriptFile).catch(() => {});
    if (runDirectory) await fs.rmdir(runDirectory).catch(() => {});
    throw new Error('Cannot launch terminal: ' + error.message + '. Check EasyCodeRunner terminal settings and that the application is installed.');
  }
}
module.exports = { platformKey, buildTerminalPlan, buildLaunchScript, buildWindowsBootstrap, launchExternalConsole };
