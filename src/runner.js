'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { buildExecutionPlan } = require('./languages');
const errorArt = fs.readFileSync(path.join(__dirname,'..','Error_Art','Err.txt'),'utf8').trimEnd();
function quote(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('The file path contains unsupported characters.');
  return "'" + value.replace(/'/g,"''") + "'";
}
function shellQuote(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('Unsupported characters in path.');
  return "'" + value.replace(/'/g,"'\\''") + "'";
}
function buildScript(file, platform = 'win32', options = {}) {
  const plan = buildExecutionPlan(file,platform,options);
  return platform==='win32' ? windowsScript(plan) : unixScript(plan);
}
function windowsScript(plan) {
  const command = step => {
    if (!/\.(cmd|bat)$/i.test(step.executable)) return '& ' + [step.executable,...step.args].map(quote).join(' ');
    // Native cmd /s quoting must survive PowerShell's native argument marshalling.
    const args = step.args.map(value => '"' + value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1') + '"').join(' ');
    return '$batchExe = (Get-Command -Name ' + quote(step.executable) + ' -CommandType Application -ErrorAction Stop).Source; ' +
      '$batchInfo = New-Object System.Diagnostics.ProcessStartInfo; $batchInfo.FileName = $env:ComSpec; $batchInfo.UseShellExecute = $false; ' +
      "$batchInfo.Arguments = '/d /s /c " + '""' + "' + $batchExe + " + quote('" ' + args + '"') + '; ' +
      '$batchProcess = [System.Diagnostics.Process]::Start($batchInfo); $batchProcess.WaitForExit(); $global:LASTEXITCODE = $batchProcess.ExitCode; $batchProcess.Dispose()';
  };
  const art = errorArt.split(/\r?\n/).map(line=>'Write-Host '+quote(line)+' -ForegroundColor Red').join('; ');
  const lines=["$ErrorActionPreference = 'Stop'",'$global:LASTEXITCODE = 0','$compiling = $false','try {','Set-Location -LiteralPath '+quote(plan.directory)];
  for(const step of plan.steps) {
    lines.push('$compiling = '+(step.kind==='compile'?'$true':'$false'));
    if(step.kind==='compile') lines.push('$compileStart = Get-Date');
    lines.push('$global:LASTEXITCODE = 0', command(step));
    if(step.kind==='compile') lines.push("if ($LASTEXITCODE -ne 0) { throw 'Compilation failed. The program was not run.' }", "Write-Host ('Compilation finished in {0:N2} seconds' -f ((Get-Date) - $compileStart).TotalSeconds) -ForegroundColor Green");
    else lines.push("Write-Host ('Program exited with code {0}' -f $LASTEXITCODE)","if ($LASTEXITCODE -ne 0) { throw 'Program execution failed.' }");
  }
  lines.push("} catch { Write-Host '#################################################' -ForegroundColor Red; if ($compiling) { Write-Host 'Compilation Unsuccessful' -ForegroundColor Red } else { Write-Host 'Execution Unsuccessful' -ForegroundColor Red }; Write-Host '#################################################' -ForegroundColor Red; "+art+"; Write-Host $_.Exception.Message -ForegroundColor Red }");
  return lines.join('; ');
}
function unixScript(plan) {
  const red = text=>"printf '\\033[31m%s\\033[0m\\n' "+shellQuote(text);
  const lines=['#!/bin/sh','failure() {',red('#################################################'),red('Execution / Compilation Unsuccessful'),...errorArt.split(/\r?\n/).map(red),red('#################################################'),'}','cd '+shellQuote(plan.directory)+' || { failure; exit 1; }'];
  for(const step of plan.steps) {
    if(step.kind==='compile') lines.push('compile_start=$(date +%s)');
    lines.push([step.executable,...step.args].map(shellQuote).join(' '),'status=$?');
    if(step.kind==='compile') lines.push('if [ "$status" -ne 0 ]; then failure; exit "$status"; fi','compile_end=$(date +%s)','printf "Compilation finished in %s seconds\\n" "$((compile_end - compile_start))"');
    else lines.push('printf "Program exited with code %s\\n" "$status"','if [ "$status" -ne 0 ]; then failure; exit "$status"; fi');
  }
  lines.push('exit "$status"');
  return lines.join('\n');
}
module.exports={ buildScript, quote, shellQuote };
