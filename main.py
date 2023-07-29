from pathlib import Path
import subprocess

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin

BASE_CPU = 0x100000
BASE_GPU = 0x100000


class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def update_offsets(self, cpu_offset: int, gpu_offset: int):
        if cpu_offset > 0:
            cpu_offset = -cpu_offset
        if gpu_offset > 0:
            gpu_offset = -gpu_offset

        cpu_value = hex(BASE_CPU + cpu_offset)
        gpu_value = hex(BASE_GPU + gpu_offset)

        ra_path = Path(decky_plugin.DECKY_PLUGIN_DIR, "bin", "ryzenadj")
        ra_result = subprocess.run(
            [str(ra_path), f"--set-coall={cpu_value}", f"--set-cogfx={gpu_value}"],
            capture_output=True,
        )

        return f"Offsets updated: CPU: {cpu_value} ({cpu_offset}), GPU: {gpu_value} ({gpu_offset}), result: {str(ra_result)}"

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello World!")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye World!")

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky_plugin.logger.info("Migrating")
