# Shape of internal state

## Context and Problem Statement

The plugin has a number of different types of state to store and keep track of, each with their own lifetime:

- UI state (e.g. first load, waiting for response, details of previous RyzenAdj execution)
    - Lifetime: Ephemeral, derived from other parts of state
    - Persistence: Not persisted
- RyzenAdj State (e.g. `cpu_offset`, `apply_cpu_offset`)
    - Lifetime: Ephemeral, until the next confdig is applied
    - Persistence: Not persisted, planned to be persisted
- UI options not directly related to RyzenAdj state (e.g. show debug information, show GPU offset tuning)
    - Lifetime: As long as the UI is visible
    - Persistence: Persisted
- Plugin options (e.g. restore settings on reboot)
    - Lifetime: As long as the plugin is loaded
    - Persistence: Persisted

This decision will decide an initial high-level policy how to categorise and store the different types of state.
This will include the shape of the state.
The goal is to make it clear how to manage these states.

This decision is not deciding by what mechanism to persist or serialise state, although pseudo-configuration may be used to help visualise the state.
Additionally, how easy it is to do these things will be a decision driver.

## Decision Drivers

- Ease of maintenance, including:
    - Ease of persisting settings in backend
    - Ease of transmission from backend to frontend
    - Ease of storage, usage and updates in frontend
- Ease of understanding
- Easy to serialise

## Considered Options

- Keep completely flat state
- Separate RyzenAdj state and options state
- Many separate types of configuration state

## Decision Outcome

"Many separate types of configuration state" seems like the option that will allow for the most encapsulated and extensible code.

## Pro and Cons of the Options

### Keep completely flat state

This conceptually means keeping everything at the same level. No nesting. No separation of the different types of state.

For example:

```yaml
apply_cpu_offset: true
cpu_offset: -10
show_debug_information: true
seen_launch_warning: false
```

- Good, straightforward to understand
- Bad, difficult to handle as there's no opportunity for encapsulation or classification of different types of options
    - For example, handling multiple RyzenAdj profiles across different games sounds arduous
- Bad, as a lot of code will need to be written to handle every option -- and it'll all be combined together
    - During development, parts of the code would naturally lend itself to being separated for maintainability... Suggesting this config should be the same.

### Separate RyzenAdj state and options state

Since tune profiles and plugin options are often used in different contexts, they could be treated and stored separately:

```toml
[tune]
apply_cpu_offset = true
cpu_offset = -10

[options]
show_debug_information = true
seen_launch_warning = false
```

- Good, this allows for the storage of multiple tune profiles reasonably easily
- Bad, for plugin options, this is perhaps still too rigid -- some configuration options can be grouped together

### Many separate types of configuration state

As discussed in _Types of Options_ below, there can be multiple different classifications of options within the plugin.
These can be kept within their own domains.

```toml
[tune]
apply_cpu_offset = true
cpu_offset = -10

[ui]
show_debug_information = true

[notification]
show_notifications = true
show_system_crash = true
show_app_settings_change = false

[modal]
never_show_again = [ "first_start", "gpu_warning" ]
```

For example, handling modal and notification configuration separately could allow for abstracting them into separate components, e.g. `ModalManager` and `NotificationManager` on the frontend and backend, allowing for encapsulated and simplified code.

There might still be room for a generic "options" section if no more-specific section fits.

- Good, as it allows for encapsulation
- Good, as it allows for storing multiple tune profiles easily
- Good, as the configuration is reasonably easy to understand and edit by hand
- Neutral, the most complex configuration to parse. However, the most complex part will likely be handled by a library.

## More Information

### Categorising types of state

#### UI and plugin options

Above, UI and plugin options are represented as being neatly sepoarate from each other.
However, I think it makes more sense to consider that any option could potentially affect both the frontend and the backend.

For example, the proposed "Show GPU offset tuning" option would show or hide UI elements, therefore it is a UI option.
However, if we say that the GPU offset was tuned to a non-default value and then the "Show GPU offset tuning" setting was turned off, it would perhaps be surprising to the user if the tune persisted.
Therefore, to disable the tune would both affect the backend and, potentially, the RyzenAdj state.
(Note: In this specific case, ignoring the GPU tuning options instead of resetting them in the RyzenAdj state would be my preferred the more expected way to go as the setting conceptually changes the _view_ of the tuning options, not the tuning options themselves.)

#### Types of options

It's worth considering that there may be whole classes or types of options.

RyzenAdj settings, for example, are a specific class of state that can be treated as an isolated unit.
Each game/app might have its own RyzenAdj settings. Pseudo config:

```toml
[tune.default]
apply_cpu_offset = true
cpu_offset = -5

[tune.app."Ratchet & Clank: Rift Apart"]
apply_cpu_offset = true
cpu_offset = -10
```

Notifications and pop-ups/modal could also be their own type of options. For example:

```toml
[notification]
show_notifications = true
show_system_crash = true
show_app_settings_change = false

[modal]
never_show_again_first_start = true
never_show_again_gpu_warning = false
```

 Side note: Alternative modal design which allows for easy resets:

 ```toml
 [modal]
 never_show_again = [ "first_start", "gpu_warning" ]
 ```
