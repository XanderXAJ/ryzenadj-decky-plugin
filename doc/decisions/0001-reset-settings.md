# Reset settings to defaults

## Context and Problem Statement

This RyzenAdj plugin allows someone to undervolt various components of their Steam Deck.

Due to the nature of undervolting, experimentation to find the right values is necessary.
Along the way, instability can be introduced.

There are a few occasions where a user might want to reset their settings back to defaults:

- The user is uncomfortable with their current settings;
- The user has noticed an issue and wants to go back to default settings;
- The user wants to compare the difference in power usage and performance between their tuned settings and stock settings.

## Considered Options

- Allow resetting individual settings using `SliderField`'s `resetValue` prop.
- One button that resets all settings at once.
- A global button shortcut to reset settings back to their defaults, which can be used even when not interacting with the plugin.

## Decision Outcome

Both resetting individual settings and all settings within the plugin make sense -- both of those will be implemented.

The global shortcut _might_ be an interesting option at some point, but it may not actually be very useful -- by the time you know something's wrong, the Steam Deck is probably going to need to be restarted (assuming it hasn't hard-locked and the watchdog timer restarts it for you!).
This can perhaps be revisited in the future.

In addition, for comparison purposes, it might be nice to have the ability to quickly jump between two different sets of settings (e.g. tuned and defaults).
This can be revisited later down the line once the plugin is more complete.
