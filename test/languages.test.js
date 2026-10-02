const { test } = require('node:test');
const assert = require('node:assert/strict');
const coverage = require('./reference-coverage.json');
const { definitions, buildExecutionPlan, findLanguage } = require('../src/languages');
const { buildScript } = require('../src/runner');

test('covers every language ID and extension in the pinned Code Runner maps', () => {
  for (const id of coverage.languageIds) assert.ok(findLanguage('/code/file.unknown', id), id);
  for (const ext of coverage.extensions) assert.ok(findLanguage('/code/file'+ext), ext);
});
test('every registry entry generates a script on each permitted OS', () => {
  for (const entry of definitions) for (const platform of ['win32','linux','freebsd','openbsd','netbsd','darwin']) {
    const file = (platform==='win32'?'C:\\code\\file':'/code/file')+entry.extensions[0];
    if (entry.platforms && !entry.platforms.includes(platform)) {
      assert.throws(()=>buildScript(file,platform),/requires/);
    } else {
      const plan=buildExecutionPlan(file,platform);
      assert.ok(plan.steps.length);
      assert.ok(plan.steps.every(step=>step.executable && Array.isArray(step.args)));
      assert.match(buildScript(file,platform),/Error!!/);
    }
  }
});
test('file variants use the correct runner even when their language mode is shared', () => {
  assert.equal(buildExecutionPlan('/code/test.kts','linux',{languageId:'kotlin'}).steps[0].executable,'kotlinc');
  assert.deepEqual(buildExecutionPlan('/code/test.csproj','linux',{languageId:'xml'}).steps[0].args,['run','--project','/code/test.csproj']);
  assert.equal(findLanguage('/code/test.C','c').id,'cpp');
  assert.equal(findLanguage('/code/test.unknown','ruby').id,'ruby');
});
test('custom executor preserves literal arguments and compiler outputs', () => {
  const file="C:\\Sam's code\\a.cpp";
  const plan=buildExecutionPlan(file,'win32',{executors:{cpp:{executable:'{binary}',args:[],compile:{executable:'C:\\LLVM\\clang++.exe',args:['{file}','-o','{binary}']}}}});
  assert.equal(plan.steps[0].args[0],file);
  assert.equal(plan.steps[1].executable,"C:\\Sam's code\\a.exe");
  assert.equal(buildExecutionPlan('/code/foo.custom','linux',{executors:{'.custom':{executable:'/opt/tool',args:['{file}']}}}).steps[0].executable,'/opt/tool');
  assert.throws(()=>buildExecutionPlan('/code/foo.py','linux',{executors:{python:{executable:'python3',args:'bad'}}}),/array/);
});
test('converters name their output files and .NET project files pass explicit project paths', () => {
  for(const ext of ['.sass','.scss','.less']) assert.equal(buildExecutionPlan('/code/main'+ext,'linux').steps.at(-1).args.at(-1),'/code/main.css');
  assert.equal(buildExecutionPlan('/code/main.pkl','linux').steps[0].args.at(-1),'/code/main.yaml');
  assert.equal(buildExecutionPlan('/code/main.fsproj','linux').steps[0].executable,'dotnet');
});
