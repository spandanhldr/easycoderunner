const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildScript } = require('../src/runner');

test('Windows batch runners preserve special paths, arguments, source bytes and failure artwork', { skip: process.platform !== 'win32' }, () => {
  const scratch = path.resolve('..','test-work');
  fs.mkdirSync(scratch,{recursive:true});
  const dir=fs.mkdtempSync(path.join(scratch,"batch's & test-"));
  const file=path.join(dir,'hello.bat');
  const run = script => spawnSync('powershell.exe',['-NoProfile','-OutputFormat','Text','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{encoding:'utf8',timeout:10000});
  try {
    const source='@echo off\r\necho BATCH_OK\r\n';
    fs.writeFileSync(file,source);
    assert.match(run(buildScript(file)).stdout,/BATCH_OK/);
    assert.equal(fs.readFileSync(file,'utf8'),source);
    fs.writeFileSync(file,'@echo off\r\necho "ARG_%~1"\r\n');
    const override={'.bat':{executable:file,args:['argument with & spaces']}};
    assert.match(run(buildScript(file,'win32',{executors:override})).stdout,/ARG_argument with & spaces/);
    fs.writeFileSync(file,'@echo off\r\nexit /b 7\r\n');
    const failed=run(buildScript(file));
    assert.match(failed.stdout,/Program exited with code 7/);
    assert.match(failed.stdout,/Error!!/);
  } finally {
    fs.unlinkSync(file);
    fs.rmdirSync(dir);
  }
});
