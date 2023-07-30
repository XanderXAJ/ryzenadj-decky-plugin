# Restoring tuned settings after sleep or charge events

## Context and Problem Statement

These are the power events where settings may need to be restored:

- When the Deck has gone to sleep, the tuned settings likely need to be reapplied.
- When the Deck has been shutdown or restarted, the tuned settings will need to be reapplied.

This ADR discusses what should happen after the Deck has awoken from sleep.

These assumptions are being made:

- That it is necessary to restore tuned settings after a sleep/charge event -- no code is unnecessary if this is untrue, but it's good to consider the options anyway.
- That sleep/charge events can be detected -- this will be revisited if that turns out not to be true.

## Considered Options

- Don't reapply settings
- Always reapply settings

## Decision Outcome

"Always reapply settings" as it'll provide a less manual user experience, assuming that it is both necessary and possible to do so.

**Update #1 2023-07-30:** Cursory examination suggests that tuned settings _do not_ need to be reapplied when the machine is plugged in to charge or unplugged, at least in Game Mode (where this plugin applies).
No action is needed to detect charge events.

**Update #2 2023-07-30:** Cursory examination suggests that tuned settings _do_ need to be reapplied after the machine is put to sleep.
**Action is needed to detect sleep events.**

## Pros and Cons of the Options

### Don't reapply settings

- Good, as it requires no code and is simple
- Good, as it is potentially more stable if the user had chosen unstable settings
- Bad, as it means needing to reapply the settings after every sleep/charge event

### Always reapply settings

- Good, as user's desired settings will stick across events, which is likely user expectation
- Bad, as sleep/charge events needs to be detected and responded to

## More Information

- [Steam Deck Software Undervolt](https://github.com/KyleGospo/Steam-Deck-Software-Undervolt/tree/main)
