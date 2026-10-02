const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildScript, shellQuote } = require('../src/runner');
const { platformKey, buildTerminalPlan, buildWindowsBootstrap } = require('../src/external-console');
const manifest = require('../package.json');

test('every terminal in Settings has a launch adapter on its OS', () => {
  const properties = Object.assign({}, ...manifest.contributes.configuration.map(group => group.properties));
  for (const [platform, key] of [['win32','windows'], ['linux','linux'], ['freebsd','bsd'], ['openbsd','bsd'], ['netbsd','bsd'], ['dragonfly','bsd'], ['darwin','macos']]) {
    assert.equal(platformKey(platform), key);
    const file = platform === 'win32' ? "C:\\Sam's code\\hello.js" : "/home/Sam's code/hello.js";
    for (const terminal of properties['easycoderunner.' + key + '.terminal'].enum) {
      const plan = buildTerminalPlan(platform, file, buildScript(file, platform), {
        terminal, customPath: 'my-terminal', customArgs: platform === 'win32' ? ['{encodedScript}'] : ['-e', '/bin/sh', '{script}']
      }, platform === 'win32' ? 'C:\\storage\\run.ps1' : '/storage/run.sh');
      assert.ok(plan.executable);
      assert.ok(plan.args.length || plan.commandLine);
      assert.equal(plan.cwd, platform === 'win32' ? "C:\\Sam's code" : "/home/Sam's code");
    }
  }
});
test('custom arguments preserve each path as one argument and reject incomplete configuration', () => {
  const plan = buildTerminalPlan('linux', '/code/a.js', '', { terminal:'custom', customPath:'/opt/terminal', customArgs:['-e','/bin/sh','{script}','{cwd}'] }, "/storage/a b's.sh");
  assert.deepEqual(plan.args, ['-e','/bin/sh',"/storage/a b's.sh",'/code']);
  assert.throws(() => buildTerminalPlan('linux','/code/a.js','',{terminal:'custom',customPath:'x',customArgs:[]},'/run.sh'), /must include/);
  assert.throws(() => buildTerminalPlan('darwin','/code/a.js','',{terminal:'custom'},'/run.sh'), /custom terminal executable/);
});
test('Windows pause toggle is included in the encoded command', () => {
  for (const pauseAfterRun of [true,false]) {
    const plan = buildTerminalPlan('win32','C:\\code\\a.js','Write-Host hello',{pauseAfterRun});
    const decoded = Buffer.from(plan.args.at(-1),'base64').toString('utf16le');
    assert.equal(decoded.includes('ReadKey'),pauseAfterRun);
    assert.match(buildWindowsBootstrap(plan), /-WindowStyle Normal/);
  }
});
test('Unix uses portable shell commands, python3 and non-Windows binary names', () => {
  for (const platform of ['linux','freebsd','openbsd','netbsd','darwin']) {
    for (const ext of ['py','js','dart','go','c','cpp','java','kt']) assert.match(buildScript('/code/a.'+ext,platform), /exit "\$status"/);
    assert.match(buildScript('/code/a.py',platform), /'python3'/);
    assert.match(buildScript('/code/a.cpp',platform), /a\.out/);
  }
});

const shell = process.platform === 'win32' ? ['C:/Program Files/Git/bin/bash.exe','C:/msys64/usr/bin/bash.exe'].find(fs.existsSync) : '/bin/sh';
function unixPath(value) { return process.platform === 'win32' ? value.replace(/\\/g,'/') : value; }
test('POSIX execution preserves special paths, reports failure art and prevents stale binary execution', { skip: !shell }, () => {
  const scratch = path.resolve('..','test-work');
  fs.mkdirSync(scratch,{recursive:true});
  const dir = fs.mkdtempSync(path.join(scratch,'runner-'));
  const js = path.join(dir,"hello's $(oops) & test.js");
  const cpp = path.join(dir,'fail.cpp');
  const stale = path.join(dir,'fail.out');
  try {
    fs.writeFileSync(js,"console.log('POSIX_OK')");
    const original = fs.readFileSync(js);
    const good = spawnSync(shell,['-c',buildScript(unixPath(js),'linux')],{encoding:'utf8'});
    assert.equal(good.status,0,good.stderr);
    assert.match(good.stdout,/POSIX_OK/);
    assert.deepEqual(fs.readFileSync(js),original);
    const roundtrip = spawnSync(shell,['-c','printf %s '+shellQuote("space's $(evil); & test")],{encoding:'utf8'});
    assert.equal(roundtrip.stdout,"space's $(evil); & test");
    fs.writeFileSync(cpp,'invalid C++ code');
    fs.writeFileSync(stale,'#!/bin/sh\necho STALE_BINARY_RAN\n',{mode:0o700});
    const failed = spawnSync(shell,['-c',buildScript(unixPath(cpp),'freebsd')],{encoding:'utf8'});
    assert.notEqual(failed.status,0);
    assert.match(failed.stdout,/Error!!/);
    assert.doesNotMatch(failed.stdout,/STALE_BINARY_RAN/);
  } finally {
    for (const file of [js,cpp,stale]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(dir);
  }
});
