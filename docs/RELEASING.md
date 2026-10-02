# Publishing updates

Pushes to `main` and pull requests run tests on Windows, Linux, and macOS. Successful main builds include a downloadable VSIX artifact in GitHub Actions.

## One-time Marketplace setup

In the Visual Studio Marketplace publisher management page for `spandanhldr`, configure a trusted publishing policy for GitHub owner `spandanhldr`, repository `easycoderunner`, and workflow `release.yml` (located at `.github/workflows/release.yml`).

In GitHub repository Settings → Secrets and variables → Actions → Variables, create `PUBLISH_MARKETPLACE` with value `true` after the policy is configured. Publishing uses OIDC; no personal access token is stored in GitHub.

Official instructions: [vsce trusted publishing](https://github.com/microsoft/vscode-vsce#trusted-publishing).

## Release a change

1. Make the change, including display-name edits in `package.json`. Keep `name` and `publisher` unchanged so existing installations receive updates.
2. Increase the version in `package.json` and `package-lock.json`, update `CHANGELOG.md`, and commit to `main`.
3. Wait for CI to pass, then push a matching version tag:

```sh
git tag v0.4.2
git push origin v0.4.2
```

The release workflow tests the tagged source, checks that its version matches the tag, packages a VSIX, and attaches it to a GitHub Release. If `PUBLISH_MARKETPLACE=true`, it also publishes that same VSIX to the Marketplace. Follow progress in the repository Actions tab. Before enabling the variable, releases still build and publish to GitHub.

Use a new version and matching tag for each later update. Changing GitHub files alone does not update the Marketplace listing; the publication step must succeed.
