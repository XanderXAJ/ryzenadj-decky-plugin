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

### Building and testing the plugin

This plugin uses scripts modified from the [decky-plugin-template], which target the VSCode family of editors.

To see the available tasks, run the `Tasks: Run Task` action, or open [`/.vscode/tasks.json`](/.vscode/tasks.json).

#### Initial setup

Since SSH is used to deploy the plugin, your Steam Deck also requires initial configuration:

1. Set a user password by running:

   ```shell
   passwd
   ```

   Follow the prompts and remember the password.

2. Enable the SSH daemon to allow logins over SSH:

   ```shell
   sudo systemctl enable sshd.service
   sudo systemctl start sshd.service
   ```

3. SSH is now enabled and running.
   If you're unsure how to SSH to the Deck, [follow these instructions][deck-ssh].

If SSH is not working at this point, [see these additional instructions][deck-ssh].

The supplied VSCode family build tasks require initial configuration:

1. Copy [`/.vscode/defsettings.json`](/.vscode/defsettings.json) to [`/.vscode/settings.json`](/.vscode/settings.json).
2. Update the new [`/.vscode/settings.json`](/.vscode/settings.json) file to match your Deck, including the Deck's current IP in `deckip` and your Deck's user password (the one you use with `sudo`, not your Steam account) in `deckpass`.
    - Alternatively, create a `deck` entry in your `~/.ssh/config` and set your `deckip` to `deck`.
        This means you can both run the deploy tasks and SSH directly to the Deck while only have one location to update.
        ```
        Host deck
            HostName 0.0.0.0
        ```

[deck-ssh]: https://gist.github.com/andygeorge/eee2825fa6446b629745ea92e862593a

#### Deploying a change

Go through the following every time you make a change:

1. In VSCode, run the `Tasks: Run Build Task` action.
   Under the hood, this runs the `builddeploy` task to both build and deploy the plugin to Deck.
2. Observe the output pane for any errors.

#### Other important information

If you are receiving build errors due to an out of date library, you should run this command inside of your repository:

```bash
pnpm update decky-frontend-lib --latest
```

### Backend build

This plugin builds [RyzenAdj] from source as it does not provide pre-built binaries.
See the [`/backend`](/backend/) directory for more details.

### Enable live reloading of plugins

Decky Loader can live reload plugins but the functionality is disabled by default.

To enable live reloading on Steam Deck/Linux, we'll add the needed environment variable to Decky's `plugin_loader` service:

1. Run:

   ```shell
   sudo systemctl edit plugin_loader.service
   ```

   This creates an override file where we can add an environment variable.

2. Add the following in between the comments:

   ```shell
   Environment=LIVE_RELOAD=1
   ```

   It'll look something like this when done:

   ```
   ### Editing /etc/systemd/system/plugin_loader.service.d/override.conf
   ### Anything between here and the comment below will become the new contents of the file

   Environment=LIVE_RELOAD=1

   ### Lines below this comment will be discarded
   # ...
   ```

3. Either restart the service or restart the Deck/machine to load the new environment variable:

   ```shell
   # Restart the service
   sudo systemctl restart plugin_loader.service
   # OR: Restart the Deck
   sudo reboot
   ```

Note: It takes a few moments to detect changes have occurred.
Additionally, it'll only hot reload if your plugin is currently not being displayed.
If your plugin hasn't live reloaded, try closing your plugin's UI.

Technical Note: Strictly speaking, the `LIVE_RELOAD` environment variable only affects the frontend code -- backend code is always hot reloaded.

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

### Debugging the Python Plugin Loader backend

Plugin loader is the component that loads plugins (oddly enough).
See its logs by running:

```shell
journalctl -u plugin_loader -b0
```

### Dependencies

As per other Decky Loader plugins, this plugin requires Node.js v16.14+ and `pnpm` (v8.5.1) installed.

Please make sure to install pnpm v8.5.1 to prevent issues with [decky-plugin-database] CI during plugin submission.

`pnpm` is most easily installed via `npm`.

#### Install pnpm on Linux

```bash
sudo npm i -g pnpm@8.5.1
```

If you would like to build plugins that have their own custom backends, Docker is required as it is used by the Decky CLI tool.

## Special Thanks

Special thanks to @FlyGoat and the contributors of [RyzenAdj].
Without [RyzenAdj], this plugin would not have been possible.

In addition, special thanks to the [Steam Deck Homebrew community][SteamDeckHomebrew] for providing both [Decky Loader][decky-loader], [the plugin template][decky-plugin-template], and help to all my questions on how to accomplish my goals.

[SteamDeckHomebrew]: https://github.com/SteamDeckHomebrew
