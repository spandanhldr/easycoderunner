# Contributing

Thanks for helping improve EasyCodeRunner. Small fixes, terminal adapter tests, and clearer documentation are welcome.

## Work locally

```sh
git clone https://github.com/spandanhldr/easycoderunner.git
cd easycoderunner
npm ci
npm test
```

Open the folder in VS Code and press F5 to start the Extension Development Host. Test a saved source file in a trusted workspace. Use `npm run package` to build a VSIX.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/languages.js` | Language detection and executable/argument mappings |
| `src/runner.js` | PowerShell and POSIX wrappers, exit checks, and artwork |
| `src/external-console.js` | External terminal adapters and launch arguments |
| `src/run-config.js` | Editable command parsing and per-language profiles |
| `src/extension.js` | VS Code commands and Settings integration |
| `test/` | Coverage, execution, shortcuts, and persistence checks |
| `Error_Art/Err.txt` | Original error artwork |

## Send a change

Create a branch, keep the change focused, and open a pull request. Explain the problem, the resulting behavior, and how you tested it. Add a meaningful regression check when changing execution or configuration behavior.

When adding a terminal adapter, provide its documented CLI syntax and test it on that operating system. When adding a runner, specify file extensions, the required tool, platform constraints, and whether it needs a project. Keep source paths as literal arguments.

## Reporting issues

Include your OS, VS Code and extension versions, selected terminal, language/toolchain, and a small reproducible source file. Include the terminal error text and relevant Run Config. See the issue templates for a starting point.
