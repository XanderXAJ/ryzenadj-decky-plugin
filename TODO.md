# TODO

- Backend: On plugin load, restore tuned settings, except when a crash is detected
- Backend: On plugin load, do not reapply tuned settings if specific button combination is held
- Frontend: Add modal when the plugin is first loaded to warn about crashes, advise on making small modifications, etc.
    - Consider politely forcing people to see the modal for 5+ seconds to ensure it isn't accidentally skipped and at least give an opportunity for it to sink in.
- Frontend+backend: Investigate whether it is worthwhile to add support for setting APU TDP (`--slow-limit` and `--fast-limit`)
    - Does it support limits under 3W?
- Documentation: Add tuning guide
- Frontend: Don't send configuration update immediately after initialising
