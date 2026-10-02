'use strict';
const path = require('node:path');
const definitions = [];
function add(id, name, extensions, executable, args = ['{file}'], extra = {}) {
  definitions.push({ id, name, extensions: extensions.split(' '), executable, args, ...extra });
}
function compiled(id, name, extensions, executable, args, extra = {}) {
  add(id, name, extensions, '{binary}', [], { compile: { executable, args }, ...extra });
}
add('javascript','JavaScript','.js .mjs .cjs','node');
add('javascriptreact','JavaScript React','.jsx','node');
compiled('c','C','.c','gcc',['{file}','-o','{binary}']);
compiled('cpp','C++','.cpp .cc .cxx .c++','g++',['{file}','-o','{binary}']);
add('java','Java','.java','java',['-cp','{directory}','{stem}'],{compile:{executable:'javac',args:['{file}']}});
add('python','Python','.py .pyw','python',['-u','{file}'],{unixExecutable:'python3'});
add('php','PHP','.php','php');
add('perl','Perl','.pl .pm','perl');
add('perl6','Raku / Perl 6','.raku .rakumod .p6 .pl6','raku');
add('ruby','Ruby','.rb','ruby');
add('go','Go','.go','go',['run','{file}']);
add('lua','Lua','.lua','lua');
add('groovy','Groovy','.groovy .gvy','groovy');
add('powershell','PowerShell','.ps1','powershell.exe',['-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File','{file}'],{unixExecutable:'pwsh'});
add('bat','Batch / CMD','.bat .cmd','{file}',[],{platforms:['win32']});
add('shellscript','Bash / Shell','.sh .bash','bash');
add('fsharp','F# Script','.fsx .fs','dotnet',['fsi','{file}']);
add('csharp','C# Script','.cs .csx','scriptcs');
add('fsharp-project','F# (.NET project)','.fsproj','dotnet',['run','--project','{file}']);
add('csharp-project','C# (.NET project)','.csproj','dotnet',['run','--project','{file}']);
add('vbscript','VBScript','.vbs','cscript.exe',['//Nologo','{file}'],{platforms:['win32']});
compiled('vb','Visual Basic .NET','.vb','vbc',['/nologo','/out:{binary}','{file}'],{platforms:['win32']});
add('typescript','TypeScript','.ts','ts-node',['{file}'],{windowsExecutable:'ts-node.cmd'});
add('typescriptreact','TypeScript React','.tsx','ts-node',['{file}'],{windowsExecutable:'ts-node.cmd'});
add('coffeescript','CoffeeScript','.coffee','coffee',['{file}'],{windowsExecutable:'coffee.cmd'});
add('scala','Scala','.scala .sc','scala');
add('swift','Swift','.swift','swift');
add('julia','Julia','.jl','julia');
add('crystal','Crystal','.cr','crystal',['run','{file}']);
add('ocaml','OCaml Script','.ml','ocaml');
add('r','R','.r','Rscript');
add('applescript','AppleScript','.applescript .scpt','osascript',['{file}'],{platforms:['darwin']});
add('elixir','Elixir','.exs .ex','elixir');
add('clojure','Clojure','.clj .cljc','lein',['exec','{file}']);
add('haxe','Haxe','.hx','haxe',['--cwd','{directory}','--run','{stem}']);
compiled('objective-c','Objective-C','.m','gcc',['-framework','Cocoa','{file}','-o','{binary}'],{platforms:['darwin']});
compiled('rust','Rust','.rs','rustc',['{file}','-o','{binary}']);
add('racket','Racket','.rkt','racket');
add('scheme','Scheme','.scm .ss','csi',['-script','{file}']);
add('ahk','AutoHotkey','.ahk','autohotkey',['{file}'],{platforms:['win32']});
add('autoit','AutoIt','.au3','autoit3',['{file}'],{platforms:['win32']});
add('kotlin','Kotlin','.kt','java',['-jar','{jar}'],{compile:{executable:'kotlinc',args:['{file}','-include-runtime','-d','{jar}']}});
add('kotlin-script','Kotlin Script','.kts','kotlinc',['-script','{file}']);
add('dart','Dart','.dart','dart');
compiled('pascal','Free Pascal','.pas .pp','fpc',['{file}','-o{binary}']);
add('haskell','Haskell','.hs .lhs','runghc');
add('nim','Nim','.nim','nim',['compile','--verbosity:0','--hints:off','--run','{file}']);
compiled('d','D','.d','dmd',['{file}','-of={binary}']);
add('lisp','Common Lisp','.lisp .lsp .cl','sbcl',['--script','{file}']);
add('kit','Kit','.kit','kitc',['--run','{file}']);
add('v','V','.v .vsh','v',['run','{file}']);
add('scss','SCSS','.scss','sass',['--style','expanded','{file}','{css}'],{windowsExecutable:'sass.cmd'});
add('sass','Sass','.sass','sass',['--style','expanded','{file}','{css}'],{windowsExecutable:'sass.cmd'});
compiled('cuda-cpp','CUDA','.cu','nvcc',['{file}','-o','{binary}']);
add('less','Less','.less','lessc',['{file}','{css}'],{windowsExecutable:'lessc.cmd'});
compiled('fortran','Fortran','.f .for .f77 .f90 .f95 .f03 .f08','gfortran',['{file}','-o','{binary}']);
add('ring','Ring','.ring','ring');
add('sml','Standard ML','.sml','sml');
add('zig','Zig','.zig','zig',['run','{file}']);
add('mojo','Mojo','.mojo .🔥','mojo',['run','{file}']);
add('erlang','Erlang escript','.erl .escript','escript');
add('spwn','SPWN','.spwn','spwn',['build','{file}']);
add('pkl','Pkl','.pkl','pkl',['eval','-f','yaml','{file}','-o','{yaml}']);
add('gleam','Gleam','.gleam','gleam',['run','-m','{stem}']);
const aliases = { raku:'perl6', FortranFreeForm:'fortran', 'fortran-modern':'fortran', 'fortran_fixed-form':'fortran', 'fortran-free-form':'fortran', 'visual-basic':'vb', vbnet:'vb', autohotkey:'ahk', cuda:'cuda-cpp', commonlisp:'lisp', 'standard-ml':'sml' };
function findLanguage(file, languageId) {
  const ext = path.extname(file);
  if (ext === '.C') return definitions.find(entry=>entry.id==='cpp');
  return definitions.find(entry=>entry.extensions.includes(ext.toLowerCase())) || definitions.find(entry=>entry.id===(aliases[languageId] || languageId));
}
function expand(value, variables) {
  if (typeof value !== 'string' || /[\r\n\0]/.test(value)) throw new Error('Executor values must be single-line strings.');
  return value.replace(/\{(filename|file|directory|stem|binary|jar|css|yaml)\}/g,(_,key)=>variables[key==='filename'?'file':key]);
}
function buildExecutionPlan(file, platform = 'win32', options = {}) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const directory = paths.dirname(file);
  const stem = paths.basename(file,paths.extname(file));
  const variables = { file, directory, stem, binary:paths.join(directory,stem+(platform==='win32'?'.exe':'.out')), jar:paths.join(directory,stem+'.jar'), css:paths.join(directory,stem+'.css'), yaml:paths.join(directory,stem+'.yaml') };
  const entry = findLanguage(file,options.languageId);
  const runConfig=entry && options.runConfigs && options.runConfigs[entry.id];
  if(runConfig) {
    const commands=require('./run-config').parseRunConfig(runConfig);
    return {language:entry.name,directory,steps:commands.map(command=>({kind:command.kind,executable:expand(command.executable,variables),args:command.args.map(arg=>expand(arg,variables))}))};
  }
  const overrides = options.executors || {};
  const override = overrides[paths.extname(file).toLowerCase()] || overrides[options.languageId] || (entry && overrides[entry.id]);
  const selected = override || entry;
  if (!selected) throw new Error('Unsupported language. Select a supported VS Code language mode or add an EasyCodeRunner Executors entry.');
  if (!override && entry.platforms && !entry.platforms.includes(platform)) throw new Error(entry.name+' requires '+entry.platforms.join(', ')+'. Configure a custom executor to use another toolchain.');
  function step(config,kind) {
    if (!config || typeof config.executable!=='string' || !config.executable.trim()) throw new Error('Executor must specify an executable.');
    const args = config.args === undefined ? ['{file}'] : config.args;
    if (!Array.isArray(args)) throw new Error('Executor args must be an array of strings.');
    return { kind, executable:expand(config.executable,variables), args:args.map(arg=>expand(arg,variables)) };
  }
  const steps=[];
  if(selected.compile) steps.push(step(selected.compile,'compile'));
  const executable = override ? selected.executable : platform==='win32' ? entry.windowsExecutable || selected.executable : entry.unixExecutable || selected.executable;
  steps.push(step({...selected,executable},'run'));
  return { language:entry ? entry.name : options.languageId || paths.extname(file), directory, steps };
}
module.exports = { definitions, aliases, findLanguage, buildExecutionPlan };
