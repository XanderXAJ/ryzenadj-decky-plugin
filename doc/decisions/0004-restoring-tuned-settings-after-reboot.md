# Restoring tuned settings after reboot

## Context and Problem Statement

When the machine has rebooted, any previously applied tuned settings will be lost.
This means that they need to be reapplied.

However, it should not be assumed that the settings should always be reapplied -- it is possible that the machine rebooted because the applied settings were unstable and caused it to crash.
If these unstable settings were automatically reapplied, we might cause the system to get stuck in a boot loop, requiring the operating system to be reset.

## Decision Drivers

- Never lock a user out of their machine
- Be as automatic as possible

## Considered Options

- Always reapply settings
- Always reapply settings, but allow holding a button/combination on startup to reset settings
- Attempt to automatically detect a system crash and only apply settings when crash has not occurred
- Never reapply settings

## Decision Outcome

"Attempt to automatically detect a system crash and only apply settings when crash has not occurred", as it is the most automatic.
However, as of the time of writing, its reliability is yet unproven.

Since software should always empower the user, "Always reapply settings, but allow holding a button/combination on startup to reset settings" will also be implemented if technically feasible.

In either case, when the settings aren't applied a notification should be shown to the user explaining the reason.

## Pro and Cons of the Options

### Always reapply settings

- Good, as the user does not need to reapply settings every boot
- Bad, as the settings may be unstable, meaning restoring the setting may cause a crash

### Always reapply settings, but allow holding a button/combination on startup to reset settings

- Good, as it allows the user to override any decision made by the plugin, providing an escape hatch
- Neutral, as the button detection needs to be rock-solid to be an effective measure
- Bad, as the user needs to know that this action can be taken.
    If they don't, and there's no other safety measures, they may think they're locked out of the machine.

### Attempt to automatically detect a system crash and only apply settings when crash has not occurred

- Good, as the machine should continue working without manual intervention, even if unstable settings are applied.
- Neutral, as the crash detection needs to be rock-solid for this to be an effective measure.
    Likewise, if the detection logic is too sensitive, stable settings may get reverted for no good reason.
- Bad, as if the crash detection logic does not detect crashes correctly and there are no other safety measures, the user could get locked out of the machine.

### Never reapply settings

- Good, as the user will never get locked out of their machine.
- Bad, as manual action is needed to reapply the tuning settings, which is laborious.

## More Information: Detecting a crash

This article provides a few strategies: <https://access.redhat.com/articles/2642741>

### Inspect wtmp with last -x

After reboot:

```shell
(deck@a-deck bin)$ last -Fxn2 shutdown reboot
reboot   system boot  5.13.0-valve36-1 Sun Jul 30 13:00:24 2023   still running
shutdown system down  5.13.0-valve36-1 Sun Jul 30 13:00:03 2023 - Sun Jul 30 13:00:24 2023  (00:00)

wtmp begins Mon Dec 19 14:06:55 2022
```

Note that there is one "system down" and one "system boot" event.
The most recent event is at the top.

After crash:

```shell
(deck@a-deck bin)$ last -Fxn2 shutdown reboot
reboot   system boot  5.13.0-valve36-1 Sun Jul 30 11:57:16 2023   still running
reboot   system boot  5.13.0-valve36-1 Sun Jul 30 11:50:24 2023   still running

wtmp begins Mon Dec 19 14:06:55 2022
```

Note that there are two "system boot" lines mentioning it is "still running".
This indicates there was no graceful shutdown.

This method is viable on Steam Deck.

### Manage lockfile when plugin loaded and unloaded

Since Decky Loader calls plugin methods when the plugin is loaded and unloaded, this could be used as a measure to detect a system crash.

Specifically:

1. The plugin creates a lockfile when the plugin loads.
    The plugin deletes the lockfile when the plugin unloads.
2. When loading, the plugin can check for the presence of the lockfile:
    1. If the lockfile is absent, apply tuned settings.
    2. If the lockfile is still present, this indicates a system crash.
        Do not load the tuned settings and notify the user.

I haven't found clear documentation on exactly when the plugin's load and unload methods are called.
Hence, this assumes that the plugin's unload method is always called when the system is rebooted or Game Mode is exited (e.g. to switch to Desktop Mode).

If the load and unload methods are additionally called on every sleep and wake, this wouldn't appear to cause any additional issues, so long as the load and unload methods are called a balanced number of times (e.g. one load call followed by one unload call).

### Combining detection methods

It's possible to combine multiple of the above methods, and to not load settings if _any_ of them detect a system crash.
