# RyzenAdj Decky Plugin

[Decky Loader][decky-loader] plugin to use [RyzenAdj] to tune how your Steam Deck runs in Game Mode.

**This plugin is currently in its early stages and isn't ready for most people. If you're _very_ keen, you can build and install the plugin yourself -- see below.**

[**See the RyzenAdj Decky Plugin documentation here!**](https://xanderxaj.github.io/ryzenadj-decky-plugin/)

[decky-loader]: https://github.com/SteamDeckHomebrew/decky-loader
[ryzenadj]: https://github.com/FlyGoat/RyzenAdj

## Disclaimer

While every effort is made to make the plugin safe and robust to use, by the very nature of the tuning [RyzenAdj] provides, it is possible to cause system instability or even hardware damage that may not be covered by Valve's warranty.

By using this plugin, you accept responsibility for all consequences of using this plugin.
The developers of this plugin accept no liability or responsibility for damages.

See the [LICENSE](/LICENSE) for the full terms.

## Development

- [Plugin development wiki](https://wiki.deckbrew.xyz/en/user-guide/home#plugin-development)
- [decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) provides React components for usage in the frontend
- [decky-loader] handles plugin loading -- it can be useful to look at its source code to see what's going on
- [decky-plugin-database] allows the plugin to be installed from Loader's built-in store
- [decky-plugin-template] from which this plugin is derived
- [React TypeScript Cheatsheets](https://react-typescript-cheatsheet.netlify.app/) has lots of useful info for developing the frontend

[decky-plugin-database]: https://github.com/SteamDeckHomebrew/decky-plugin-database
[decky-plugin-template]: https://github.com/SteamDeckHomebrew/decky-plugin-template

### Enable live reloading of plugins

Decky Loader can live reload plugins but the functionality is disabled by default.

To enable live reloading on Steam Deck/Linux:

1. Create `/etc/profile.d/decky.sh` with the following contents:

   ```shell
   LIVE_RELOAD=1
   export LIVE_RELOAD
   ```

2. Restart the Deck/machine to load the new environment variable.

Note: Live reloading only appears to occur when Decky Loader's settings are opened.
If your plugin hasn't live reloaded, try opening Decky Loader's settings.

### Debugging using CEF debugging

[Follow these instructions.](https://docs.deckthemes.com/CSSLoader/Cef_Debugger/)

### Debugging using `console.log()` etc.

1. Follow _Debugging using CEF debugging_.
2. Inspect the `SharedJSContext` target.
3. In the new window, ensure the Console is open. See your logging messages.

### Debugging using React DevTools

Run [the standalone version of React DevTools](https://github.com/facebook/react/tree/main/packages/react-devtools), e.g.:

```shell
npx react-devtools
```

Then enter your machine's IP address (helpfully displayed by React DevTools) in to Decky Loader's developer settings.

Note: _enter only the IP address_ -- don't be smart like me and also enter the port number or protocol.

To find the plugin's components, since the core components of this plugin are prefixed with `RyzenAdj`, use the search bar to search for `RyzenAdj` and find them.

### Dependencies

As per other Decky Loader plugins, this plugin requires Node.js v16.14+ and `pnpm` (v8.5.1) installed.

Please make sure to install pnpm v8.5.1 to prevent issues with [decky-plugin-database] CI during plugin submission.

`pnpm` is most easily installed via `npm`:

#### Linux

```bash
sudo npm i -g pnpm@8.5.1
```

If you would like to build plugins that have their own custom backends, Docker is required as it is used by the Decky CLI tool.

### Building and testing the plugin

This plugin uses scripts supplied by the [decky-plugin-template], which target the VSCode family of editors.

Go through the following every time you make a change:

1. Update [`/.vscode/settings.json`](/.vscode/settings.json) file to match your Deck, including the Deck's current IP in `deckip` and your Deck's `sudo` password in `deckpass`.
2. In VSCode, run the `Tasks: Run Build Task` action.
   Under the hood, this runs the `builddeploy` task to both build and deploy the plugin to Deck.
3. Enter your _local_ sudo password (not the Deck's!) when the build task prompts.

#### Other important information

If you are receiving build errors due to an out of date library, you should run this command inside of your repository:

```bash
pnpm update decky-frontend-lib --latest
```

### Backend build

This plugin builds [RyzenAdj] from source as it does not provide pre-built binaries.
See the [`/backend`](/backend/) directory for more details.

## Special Thanks

Special thanks to @FlyGoat and the contributors of [RyzenAdj].
Without [RyzenAdj], this plugin would not have been possible.
