from dataclasses import dataclass
from pathlib import Path
import subprocess

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin

BASE_CPU = 0x100000
BASE_GPU = 0x100000


@dataclass
class RyzenAdjConfiguration:
    apply_cpu_offset: bool
    cpu_offset: int
    apply_gpu_offset: bool
    gpu_offset: int

    def cpu_value(self) -> str:
        return hex(BASE_CPU + self.cpu_offset)

    def gpu_value(self) -> str:
        return hex(BASE_GPU + self.gpu_offset)

    def flags(self) -> list[str]:
        flags = []
        if self.apply_cpu_offset:
            flags.append(f"--set-coall={self.cpu_value()}")
        if self.apply_gpu_offset:
            flags.append(f"--set-cogfx={self.gpu_value()}")
        return flags


class RyzenAdjConfigurer:
    def __init__(self, ra_path: Path) -> None:
        # TODO: Accept previous successful configuration
        self.ra_path = ra_path
        self.active_configuration = RyzenAdjConfiguration(
            apply_cpu_offset=True, cpu_offset=0, apply_gpu_offset=True, gpu_offset=0
        )

    def apply_configuration(self, new_configuration: RyzenAdjConfiguration):
        ra_cmd = [
            str(self.ra_path),
            *new_configuration.flags(),
        ]
        ra_result = subprocess.run(ra_cmd, capture_output=True, text=True)
        decky_plugin.logger.info("Applied configuration: %s", ra_result)
        # TODO: Check exit status and don't store new configuration in case of failure
        self.active_configuration = new_configuration
        return ra_cmd, ra_result

    def reapply_configuration(self):
        decky_plugin.logger.info("Reapplying active configuration")
        return self.apply_configuration(self.active_configuration)


# `self` doesn't work as expected in the Plugin class
# as it is not properly inited by Decky Loader:
#     https://github.com/SteamDeckHomebrew/decky-loader/issues/509
class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def update_offsets(self, cpu_offset: int, gpu_offset: int):
        new_configuration = RyzenAdjConfiguration(
            apply_cpu_offset=True,
            cpu_offset=cpu_offset,
            apply_gpu_offset=True,
            gpu_offset=gpu_offset,
        )
        ra_cmd, ra_result = self.rac.apply_configuration(new_configuration)

        response = {
            "cpu_offset": self.rac.active_configuration.cpu_offset,
            "cpu_value": self.rac.active_configuration.cpu_value(),
            "gpu_offset": self.rac.active_configuration.gpu_offset,
            "gpu_value": self.rac.active_configuration.gpu_value(),
            "ryzenadj_cmd": " ".join(ra_cmd),
            "ryzenadj_stderr": ra_result.stderr,
            "ryzenadj_stdout": ra_result.stdout,
        }
        decky_plugin.logger.info("update_offsets response: %s", response)
        return response

    async def active_state(self):
        config = self.rac.active_configuration

        return {
            "cpu_offset": config.cpu_offset,
            "gpu_offset": config.gpu_offset,
        }

    async def on_resume_from_suspend(self):
        decky_plugin.logger.info("Resumed from sleep, reapplying configuration")
        self.rac.reapply_configuration()

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello from RyzenAdj!")
        self.rac = RyzenAdjConfigurer(
            ra_path=Path(decky_plugin.DECKY_PLUGIN_DIR, "bin", "ryzenadj"),
        )

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye from RyzenAdj!")
