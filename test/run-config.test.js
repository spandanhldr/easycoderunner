const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseRunConfig,defaultRunConfig,RunConfigEditor}=require('../src/run-config');
const {definitions,buildExecutionPlan}=require('../src/languages');

test('every language has an editable default that parses to the same execution plan',()=>{
  for(const language of definitions) for(const platform of ['win32','linux','darwin']) {
    const text=defaultRunConfig(language.id,platform);
    assert.ok(parseRunConfig(text).length);
    if(language.platforms && !language.platforms.includes(platform)) continue;
    const file=(platform==='win32'?'C:\\code\\hello':'/code/hello')+language.extensions[0];
    const original=buildExecutionPlan(file,platform);
    const edited=buildExecutionPlan(file,platform,{runConfigs:{[language.id]:text}});
    assert.deepEqual(edited.steps,original.steps);
  }
});
test('text configs support filename, quoted tool paths, args and compile gating',()=>{
  const file="C:\\Sam's code\\test.cpp";
  const plan=buildExecutionPlan(file,'win32',{runConfigs:{cpp:'"C:\\LLVM Tools\\clang++.exe" "{filename}" -o {binary} && {binary}'}});
  assert.equal(plan.steps[0].executable,'C:\\LLVM Tools\\clang++.exe');
  assert.equal(plan.steps[0].args[0],file);
  assert.equal(plan.steps[0].kind,'compile');
  assert.equal(plan.steps[1].executable,"C:\\Sam's code\\test.exe");
  assert.equal(buildExecutionPlan('/code/a.c','linux',{runConfigs:{c:'g++ {filename}'}}).steps[0].executable,'g++');
  for(const invalid of ['gcc &&','"unclosed','gcc | cat','gcc ; cat','gcc\ncat']) assert.throws(()=>parseRunConfig(invalid));
});
test('Settings switching saves per-language commands and survives reload',async()=>{
  const settings={programmingLanguage:'c',runConfig:''};let persisted;let editor;
  function create(state) {
    return new RunConfigEditor({platform:'win32',state,
      read:key=>settings[key],
      write:async text=>{settings.runConfig=text;editor.onChange(false,true);},
      persist:async value=>{persisted=structuredClone(value);},
      report:message=>assert.fail(message)
    });
  }
  editor=create();await editor.initialize();await editor.queue;
  assert.equal(settings.runConfig,'gcc {filename} -o {binary} && {binary}');
  settings.runConfig='clang {filename} -o {binary} && {binary}';await editor.onChange(false,true);
  settings.programmingLanguage='python';await editor.onChange(true,false);
  assert.equal(settings.runConfig,'python -u {filename}');
  settings.runConfig='python -u -X dev {filename}';await editor.onChange(false,true);
  settings.programmingLanguage='c';await editor.onChange(true,false);
  assert.equal(settings.runConfig,'clang {filename} -o {binary} && {binary}');
  editor=create(persisted);await editor.initialize();await editor.queue;
  settings.programmingLanguage='python';await editor.onChange(true,false);
  assert.equal(settings.runConfig,'python -u -X dev {filename}');
  settings.runConfig='';await editor.onChange(false,true);
  assert.equal(editor.getCommands().python,undefined);
});
