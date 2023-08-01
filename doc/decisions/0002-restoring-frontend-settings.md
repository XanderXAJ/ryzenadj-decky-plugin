# Restoring frontend settings

## Context and Problem Statement

There are a few occasions where settings may need to be restored:

- When the quick access bar is closed, the frontend forgets what settings are applied and needs to be reminded.
- When the Deck has gone to sleep, the tuned settings likely need to be reapplied.
- When the Deck has been shutdown or restarted, the tuned settings will need to be reapplied.

This ADR specifically discusses restoring frontend settings.

Restoring settings can potentially be hazardous -- restoring unstable settings may lead to boot loops.
However, allowing the frontend to rehydrate its state should be a safe operation so long as due care is taken to ensure that unnecessary settings changes are avoided.

## Considered Options

- Don't restore the current state
- Have the frontend store state and restore it when needed
- Have the backend keep track of state and allow the frontend to request current state

## Decision

"Have the backend keep track of state and allow the frontend to request current state", since it is going to provide the most correct and consistent behaviour (even if it has potential to be slower).

## Pros and Cons of the Options

### Don't restore the current state

- Good, because it's already implemented
- Bad, because it is confusing for the user to see the values are reset
- Bad, because it _actually applies_ the reset settings whenever the plugin is accessed

### Have the frontend store state and restore it when needed

- Good, as state will always be ready immediately, minimising any chance of users seeing loading UI
- Bad, as there are now two sources of truth -- frontend and backend -- since the backend will need to track the current state for its own purposes anyway
    - Sources of truth could become out of sync, resulting in the frontend suggesting that settings are synced when they aren't

### Have the backend keep track of state and allow the frontend to request current state

- Good, as frontend can always reflect the backend's state
- Good, as there's only one source of truth -- less opportunity for the frontend and backend to go out of sync
- Bad, as users may see incomplete/loading UI if the backend takes a while to respond
