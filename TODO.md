# TODO

- Frontend+Backend: Supply default/reset values for settings from backend for maximum configurability and centralise as much logic as possible in backend
- Backend: On plugin load, restore tuned settings, except when a crash is detected
- Backend: On plugin load, do not reapply tuned settings if specific button combination is held
- Frontend: Add modal when the plugin is first loaded to warn about crashes, advise on making small modifications, etc.
    - Consider politely forcing people to see the modal for 5+ seconds to ensure it isn't accidentally skipped and at least give an opportunity for it to sink in.
- Frontend+backend: Investigate whether it is worthwhile to add support for setting APU TDP (`--slow-limit` and `--fast-limit`)
    - Does it support limits under 3W?
- Documentation: Add tuning guide
- Documentation: Test if userdata can be mounted when booting from external media
    - If so, consider: Backend: Only apply settings if e.g. `apply_settings_on_boot` file exists, to allow people to delete it using recovery media without needing to format userdata
- Frontend: Don't send configuration update immediately after initialising
