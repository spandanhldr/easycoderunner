# Configuration guide

[Back to EasyCodeRunner](../README.md)

## Install and settings

In VS Code's Extensions view, choose **... > Install from VSIX...** and install `easycoderunner-0.4.0.vsix`. Reload VS Code if prompted.

Open Settings with **Ctrl+,** (Cmd+, on macOS) and search **EasyCodeRunner** or `@ext:spandanhldr.easycoderunner`. Choose the terminal dropdown for your operating system:

| OS | Terminal choices |
| --- | --- |
| Windows | Windows PowerShell, Command Prompt, Windows Terminal, PowerShell 7, custom |
| Linux | XTerm, GNOME Terminal, Konsole, Xfce Terminal, Kitty, Alacritty, custom |
| BSD | XTerm, Konsole, Xfce Terminal, Kitty, Alacritty, custom |
| macOS | Apple Terminal, iTerm2, custom |

Defaults: Windows PowerShell on Windows, Apple Terminal on macOS, XTerm on Linux and BSD. Install the chosen terminal before running. Terminal selection is per machine, so paths and application choices are not synced between operating systems. BSD includes FreeBSD, OpenBSD, NetBSD and DragonFly BSD.

**Pause After Run** keeps output visible after success or failure. Windows waits for a key; Unix terminals wait for Enter. Disable it to let the command finish immediately. Some terminals, including Apple Terminal, can retain a window after its command finishes according to their own preferences.

For another terminal choose **custom**, set **Custom Path** to its executable and **Custom Args** to its launch arguments. Placeholders: `{script}`, `{command}`, `{cwd}`, and Windows-only `{encodedScript}`. Each array entry is one argument; do not add quotes around placeholders. The application must accept a command to execute; simply opening a terminal app is insufficient.

Example for a Unix terminal supporting `-e`:

```json
"easycoderunner.linux.terminal": "custom",
"easycoderunner.linux.customPath": "/usr/bin/xterm",
"easycoderunner.linux.customArgs": ["-e", "/bin/sh", "{script}"]
```

Example for a Windows Terminal compatible executable:

```json
"easycoderunner.windows.terminal": "custom",
"easycoderunner.windows.customPath": "wt.exe",
"easycoderunner.windows.customArgs": ["-w", "new", "powershell.exe", "-NoProfile", "-EncodedCommand", "{encodedScript}"]
```

On macOS, Terminal and iTerm2 use AppleScript; macOS may ask permission for VS Code to control the application. On Linux/BSD an active graphical desktop is required. External terminals run on the extension host machine; remote SSH/headless sessions cannot open a local desktop terminal with this extension.

## Shortcut

In Settings search **EasyCodeRunner** and change **Run Key**. Presets apply immediately; F12 is the default. Ctrl presets use Cmd on macOS. The selected key overrides other editor commands when a saved editor has focus.

For any other combination choose **custom**. VS Code opens Keyboard Shortcuts filtered to Run Active File; click the pencil or plus icon to record your combination. You can reopen it with **EasyCodeRunner: Change Keyboard Shortcut** from the Command Palette. Custom bindings are stored in VS Code's normal keyboard shortcuts.

When switching back to a preset, remove any manually assigned EasyCodeRunner shortcut in Keyboard Shortcuts because user bindings take priority over extension defaults.

## Edit a language's run command

In Settings search **EasyCodeRunner** and open the **Executors** category:

- **Programming Language:** choose C, C++, Python or another language in the dropdown.
- **Run Config:** edit the command shown directly below it.

For example, select **C** and set Run Config to `g++ {filename} -o {binary} && {binary}`. Each language keeps its own command; switching the dropdown loads that language's saved command. Commands apply to the active file's detected language, so selecting C in Settings does not change a Python file into C.

`{filename}` and `{file}` both mean the full source path. Paths are passed as literal arguments with quoting handled automatically. Use `&&` between compilation and execution. A command such as `g++ {filename}` performs only that compilation command; add `&& {binary}` with an explicit `-o {binary}` to run the result.

Clear Run Config to restore the built-in runner. Run Config overrides are saved in the extension's local storage separately for each language and operating system. A single line is supported; quote a tool path containing spaces. Shell pipes, redirection and semicolons require an explicit shell executor.

## Advanced custom executors

The original structured **Executors** object remains available for advanced configurations and custom extensions. It applies when the detected language has no text Run Config override. Each entry has an executable and an array of arguments; optional compile specifies a compilation step. Paths are quoted automatically. Arguments are literal; for shell syntax choose a shell explicitly.

Placeholders: `{file}`, `{directory}`, `{stem}`, `{binary}`, `{jar}`, `{css}`, `{yaml}`. A custom extension entry takes priority over a language override and the built-in registry. Custom executors may supply an alternate toolchain for a platform-specific language.

Example in settings.json:

```json
"easycoderunner.executors": {
  "python": { "executable": "C:\\Python313\\python.exe", "args": ["-u", "{file}"] },
  "cpp": {
    "compile": { "executable": "clang++", "args": ["{file}", "-o", "{binary}"] },
    "executable": "{binary}", "args": []
  },
  ".custom": { "executable": "/opt/my-runner", "args": ["{file}"] }
}
```

