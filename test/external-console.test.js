const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildLaunchScript } = require('../src/external-console');
test('external launch requests a visible console with an encoded script', () => {
  const payload = "Write-Host 'Hello'; & 'python' 'hello.py'";
  const script = buildLaunchScript("C:\\Sam's code\\hello.py", payload);
  assert.match(script, /Start-Process/);
  assert.match(script, /-WindowStyle Normal/);
  assert.match(script, /-WorkingDirectory 'C:\\Sam''s code'/);
  assert.ok(script.includes(Buffer.from(payload, 'utf16le').toString('base64')));
});
