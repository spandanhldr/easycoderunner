'use strict';
const vscode = require('vscode');
const { buildScript } = require('./runner');
const { launchExternalConsole, platformKey } = require('./external-console');
const { RunConfigEditor, defaultRunConfig } = require('./run-config');
function activate(context) {
  const profileKey='runConfigProfiles.'+process.platform;
  const editorSettings = new RunConfigEditor({
    platform: process.platform,
    state: context.globalState.get(profileKey),
    read: key => vscode.workspace.getConfiguration('easycoderunner').get(key),
    write: text => vscode.workspace.getConfiguration('easycoderunner').update('runConfig', text, vscode.ConfigurationTarget.Global),
    persist: state => context.globalState.update(profileKey, state),
    report: message => vscode.window.showErrorMessage('Easy Code Runner: '+message)
  });
  const openShortcutEditor = () => vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', '@command:easycoderunner.run');
  context.subscriptions.push(vscode.commands.registerCommand('easycoderunner.changeShortcut', openShortcutEditor));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if(event.affectsConfiguration('easycoderunner.programmingLanguage') || event.affectsConfiguration('easycoderunner.runConfig')) {
      editorSettings.onChange(event.affectsConfiguration('easycoderunner.programmingLanguage'),event.affectsConfiguration('easycoderunner.runConfig'));
    }
    if (event.affectsConfiguration('easycoderunner.runKey') && vscode.workspace.getConfiguration('easycoderunner').get('runKey') === 'custom') {
      openShortcutEditor().then(undefined, error => vscode.window.showErrorMessage('Easy Code Runner: ' + error.message));
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('easycoderunner.run', async () => {
    try {
      if (!vscode.workspace.isTrusted) throw new Error('Trust this workspace before running code.');
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.uri.scheme !== 'file') throw new Error('Open a saved source file first.');
      const document = editor.document;
      const config = vscode.workspace.getConfiguration('easycoderunner', document.uri);
      const key = platformKey(process.platform);
      if (!key) throw new Error('Unsupported operating system: ' + process.platform);
      const settings = {
        terminal: config.get(key + '.terminal'),
        customPath: config.get(key + '.customPath'),
        customArgs: config.get(key + '.customArgs'),
        pauseAfterRun: config.get('pauseAfterRun', true)
      };
      await editorSettings.queue;
      const runConfigs=editorSettings.getCommands();
      const selected=vscode.workspace.getConfiguration('easycoderunner').get('programmingLanguage','c');
      const text=vscode.workspace.getConfiguration('easycoderunner').get('runConfig','');
      if(text.trim() && text!==defaultRunConfig(selected,process.platform)) runConfigs[selected]=text;
      const script = buildScript(document.uri.fsPath, process.platform, { languageId: document.languageId, executors: config.get('executors', {}), runConfigs });
      if (!(await document.save())) throw new Error('The source file could not be saved.');
      await launchExternalConsole(document.uri.fsPath, script, settings, context.globalStorageUri.fsPath);
    } catch (error) {
      vscode.window.showErrorMessage('Easy Code Runner: ' + error.message);
    }
  }));
  editorSettings.queue=editorSettings.initialize().catch(error=>vscode.window.showErrorMessage('Easy Code Runner: '+error.message));
}
module.exports = { activate };
