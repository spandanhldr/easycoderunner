# Supported languages

[Back to Easy Code Runner](../README.md)

## Language support and requirements

This version covers every language ID and extension from Code Runner's default executor maps at commit `97af1080d09046e0129acce592f0033ff2df9f26`. It adds 64 runner definitions, including script/project variants. It does not install runtimes or compilers; install the appropriate tools on PATH. VS Code 1.85 or newer and a trusted workspace are required.

| Language | File extensions | Tools |
| --- | --- | --- |
| JavaScript | .js, .mjs, .cjs | node |
| JavaScript React | .jsx | node |
| C | .c | gcc → compiled program |
| C++ | .cpp, .cc, .cxx, .c++ | g++ → compiled program |
| Java | .java | javac → java |
| Python | .py, .pyw | python |
| PHP | .php | php |
| Perl | .pl, .pm | perl |
| Raku / Perl 6 | .raku, .rakumod, .p6, .pl6 | raku |
| Ruby | .rb | ruby |
| Go | .go | go |
| Lua | .lua | lua |
| Groovy | .groovy, .gvy | groovy |
| PowerShell | .ps1 | powershell.exe |
| Batch / CMD | .bat, .cmd | {file} |
| Bash / Shell | .sh, .bash | bash |
| F# Script | .fsx, .fs | dotnet |
| C# Script | .cs, .csx | scriptcs |
| F# (.NET project) | .fsproj | dotnet |
| C# (.NET project) | .csproj | dotnet |
| VBScript | .vbs | cscript.exe |
| Visual Basic .NET | .vb | vbc → compiled program |
| TypeScript | .ts | ts-node |
| TypeScript React | .tsx | ts-node |
| CoffeeScript | .coffee | coffee |
| Scala | .scala, .sc | scala |
| Swift | .swift | swift |
| Julia | .jl | julia |
| Crystal | .cr | crystal |
| OCaml Script | .ml | ocaml |
| R | .r | Rscript |
| AppleScript | .applescript, .scpt | osascript |
| Elixir | .exs, .ex | elixir |
| Clojure | .clj, .cljc | lein |
| Haxe | .hx | haxe |
| Objective-C | .m | gcc → compiled program |
| Rust | .rs | rustc → compiled program |
| Racket | .rkt | racket |
| Scheme | .scm, .ss | csi |
| AutoHotkey | .ahk | autohotkey |
| AutoIt | .au3 | autoit3 |
| Kotlin | .kt | kotlinc → java |
| Kotlin Script | .kts | kotlinc |
| Dart | .dart | dart |
| Free Pascal | .pas, .pp | fpc → compiled program |
| Haskell | .hs, .lhs | runghc |
| Nim | .nim | nim |
| D | .d | dmd → compiled program |
| Common Lisp | .lisp, .lsp, .cl | sbcl |
| Kit | .kit | kitc |
| V | .v, .vsh | v |
| SCSS | .scss | sass |
| Sass | .sass | sass |
| CUDA | .cu | nvcc → compiled program |
| Less | .less | lessc |
| Fortran | .f, .for, .f77, .f90, .f95, .f03, .f08 | gfortran → compiled program |
| Ring | .ring | ring |
| Standard ML | .sml | sml |
| Zig | .zig | zig |
| Mojo | .mojo, .🔥 | mojo |
| Erlang escript | .erl, .escript | escript |
| SPWN | .spwn | spwn |
| Pkl | .pkl | pkl |
| Gleam | .gleam | gleam |

Known extensions select their runner first; unknown extensions fall back to the editor's VS Code language mode. Fortran language IDs are aliases of the same compiler. Windows uses python; Unix uses python3. Raku uses the modern raku executable. F# scripts use dotnet fsi. Sass and SCSS use the current sass CLI; Less uses lessc. Windows npm-based tools use their .cmd launchers to avoid PowerShell execution-policy issues.

Batch/CMD, VBScript, Visual Basic's vbc, AutoHotkey and AutoIt default to Windows tools. AppleScript and the Cocoa Objective-C runner require macOS. Other languages depend on the availability of their toolchains for the chosen OS; a mapping does not guarantee a compiler is distributed for every OS.

Standalone Java expects a main class matching the filename in the default package; Kotlin expects a main function. C# .cs/.csx uses scriptcs; .csproj and .fsproj use dotnet run. Gleam needs a valid Gleam project in the source working directory. Haxe needs a suitable main class; Erlang files run through escript and need an escript entry point. JSX/TSX require suitable runtime/transpiler configuration, not just syntax highlighting.

The source directory is the working directory. Native programs are written beside the source as .exe on Windows and .out on Unix. Kotlin/Java create JAR/class files there. Stylesheet runners generate .css; Pkl generates .yaml. Compiler failures prevent execution of stale binaries. Output and failure artwork stay in the selected external terminal.

