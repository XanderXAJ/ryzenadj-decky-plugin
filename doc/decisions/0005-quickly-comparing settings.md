# Quickly comparing settings

## Context and Problem Statement

In the course of tuning, a user will want to see the difference between their current tuned settings and another set of settings, usually the defaults, to see the difference that has been made.
This would be particularly useful for benchmarks to verify the effct of the tuned offset.

## Decision Drivers

- Easy to compare settings
- Doesn't significantly complicate plugin usability
- Doesn't significantly add development effort unless the benefit is worth it

## Considered Options

- Use the existing reset functionality
- Allow toggling a particular setting on and off
- Add profile switching

## Decision Outcome

"Allow toggling a particular setting on and off" is reasonably simple conceptually for users to understand.

"Add profile switching" seems overkill at this time as there's only a small number of settings to manage.
The overhead in profile management and persistence doesn't seem worth it at this time.
However, if more RyzenAdj settings become available, this may become more desirable.
However, this does not preclude per-game profile management (to be discussed separately), which may have a place even with the small number of settings.

## Pro and Cons of the Options

### Use the existing reset functionality

The existing reset functionality provides something like this.
However, you can only reset back to defaults.

- Good, as the functionality already exists and requires no further development
- Bad, as, after a reset, the user needs to manually set their tuned setting again

### Allow toggling a particular setting on and off

Add a toggle for each setting, e.g. "Apply/Tune/Customise CPU Offset".
When a setting is toggled off, the default value is applied.
When a setting is toggled on, the previous tuned value is applied.

- Good, as it allows for quick comparison
- Good, as if someone wants to disable a tuning, it is clear it is disabled
- Bad, as the UI may become cluttered with a lot of toggles
    - Neutral, as there are only 1-2 settings at this time
    - Neutral, if this could be done with a controller button press instead of a separate ToggleField (although that might be difficult to discover)

### Add profile switching

Add the ability to create, modify and delete profiles of settings.

- Good, as it allows the user to not just compare between tuned settings and defaults but also different tuned settings
- Bad, adds significant complexity to the UI and interactions with the plugin as profiles need to be managed
- Bad, as it is perhaps overkill for the 1-2 tunable settings at present
