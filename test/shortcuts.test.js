const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const manifest = require('../package.json');

test('shortcut presets are conditional, F12 is default, and custom has no default binding', () => {
  const setting = manifest.contributes.configuration[0].properties['easycoderunner.runKey'];
  assert.equal(setting.default, 'f12');
  assert.ok(setting.enum.includes('custom'));
  for (const key of setting.enum) {
    const bindings = manifest.contributes.keybindings.filter(binding => binding.when.includes('config.easycoderunner.runKey == ' + key));
    assert.equal(bindings.length, key === 'custom' ? 0 : 1);
    if (key !== 'custom') {
      assert.ok(bindings[0].when.includes('editorTextFocus'));
      if (key.startsWith('ctrl+')) assert.equal(bindings[0].mac, key.replace('ctrl+', 'cmd+'));
    }
  }
  assert.ok(manifest.activationEvents.includes('onStartupFinished'));
});

test('selecting Custom opens the shortcut editor filtered to the run command', async () => {
  const originalLoad = Module._load;
  const registered = new Map();
  const opened = [];
  let selected = 'f12';
  let configListener;
  const vscode = {
    commands: {
      registerCommand(name, fn) { registered.set(name, fn); return { dispose() {} }; },
      async executeCommand(...args) { opened.push(args); }
    },
    workspace: {
      onDidChangeConfiguration(listener) { configListener = listener; return { dispose() {} }; },
      getConfiguration() { return { get(key) { return key==='runKey' ? selected : key==='programmingLanguage' ? 'c' : ''; }, async update() {} }; }
    },
    window: { showErrorMessage(message) { assert.fail(message); } },
    ConfigurationTarget: { Global: 1 }
  };
  try {
    Module._load = function(request, parent, isMain) {
      return request === 'vscode' ? vscode : originalLoad.call(this, request, parent, isMain);
    };
    delete require.cache[require.resolve('../src/extension')];
    require('../src/extension').activate({ subscriptions: [], globalState: { get() {}, async update() {} } });
    configListener({ affectsConfiguration(name) { return name === 'easycoderunner.runKey'; } });
    assert.equal(opened.length, 0);
    selected = 'custom';
    configListener({ affectsConfiguration(name) { return name === 'easycoderunner.runKey'; } });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(opened[0], ['workbench.action.openGlobalKeybindings', '@command:easycoderunner.run']);
    await registered.get('easycoderunner.changeShortcut')();
    assert.equal(opened.length, 2);
  } finally {
    Module._load = originalLoad;
    delete require.cache[require.resolve('../src/extension')];
  }
});
