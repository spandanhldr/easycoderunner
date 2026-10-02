const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildScript, quote } = require('../src/runner');
test('all original languages generate commands', () => {
  for (const ext of ['py', 'js', 'dart', 'go', 'c', 'cpp', 'java', 'kt']) assert.match(buildScript('C:\\code\\hello.' + ext), /Program exited/);
});
test('paths preserve spaces, apostrophes and shell metacharacters', () => {
  assert.equal(quote("C:\\Sam's code\\$(calc); & test.py"), "'C:\\Sam''s code\\$(calc); & test.py'");
  assert.throws(() => quote('bad\npath'));
});
test('compiler failure is checked before executing the generated program', () => {
  const script = buildScript('C:\\code\\hello.cpp');
  assert.ok(script.indexOf('if ($LASTEXITCODE -ne 0)') < script.indexOf("& 'C:\\code\\hello.exe'"));
});
test('Kotlin includes its runtime and uppercase extensions work', () => {
  assert.match(buildScript('C:\\code\\hello.KT'), /'-include-runtime'/);
  assert.match(buildScript('C:\\code\\hello.PY'), /& 'python'/);
});
test('unsupported files are rejected', () => assert.throws(() => buildScript('C:\\code\\hello.txt'), /Unsupported language/));
