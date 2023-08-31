# Shape of internal state

## Context and Problem Statement

The plugin has a number of different types of state to store and keep track of, each with their own lifetime:

- RyzenAdj State (e.g. `cpu_offset`, `apply_cpu_offset`)
    - Lifetime: Ephemeral, planned to be permanent
- UI state (e.g. first load, waiting for response)
    - Lifetime: Ephemeral, derived from other parts of state
- UI options not directly related to RyzenAdj state (e.g. show debug information, show GPU offset tuning)
    - Lifetime: Persisted
- Plugin options (e.g. restore settings on reboot)
    - Lifetime: Persisted

This decision will decide an initial policy how to categorise and store the different types of state.
This will include the shape of the state.



## Decision Drivers

- Ease of maintenance, including:
    - Ease of persisting settings in backend
    - Ease of transmission from backend to frontend
    - Ease of handling in frontend
- Ease of understanding

## Considered Options

- Keep completely flat state
- Separate RyzenAdj state and options state

## Decision Outcome

TODO
Explain which outcome(s) were chosen.

## Pro and Cons of the Options

### Title of an option

TODO
- Good, when it is good
- Neutral, when it is neither good nor bad
- Bad, when it is bad

## More Information

### Categorising types of state

#### UI and plugin options

Above, UI and plugin options are represented as being neatly sepoarate from each other.
However, I think it makes more sense to consider that any option could potentially affect both the frontend and the backend.

For example, the proposed "Show GPU offset tuning" option would show or hide UI elements, therefore it is a UI option.
However, if we say that the GPU offset was tuned to a non-default value and then the "Show GPU offset tuning" setting was turned off, it would perhaps be surprising to the user if the tune persisted.
Therefore, to disable the tune would both affect the backend and, potentially, the RyzenAdj state.
(Note: In this specific case, ignoring the GPU tuning options instead of resetting them in the RyzenAdj state would be my preferred the more expected way to go as the setting conceptually changes the _view_ of the tuning options, not the tuning options themselves.)
