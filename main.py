from pathlib import Path
import subprocess

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin

BASE_CPU = 0x100000
BASE_GPU = 0x100000


class RyzenAdjConfiguration:
    def __init__(self, cpu_offset: int, gpu_offset: int) -> None:
        if cpu_offset > 0:
            cpu_offset = -cpu_offset
        if gpu_offset > 0:
            gpu_offset = -gpu_offset

        self.cpu_offset: int = cpu_offset
        self.gpu_offset: int = gpu_offset

    def cpu_value(self) -> str:
        return hex(BASE_CPU + self.cpu_offset)

    def gpu_value(self) -> str:
        return hex(BASE_GPU + self.gpu_offset)


class RyzenAdjConfigurer:
    def __init__(self) -> None:
        # TODO: Accept previous successful configuration
        self.active_configuration = RyzenAdjConfiguration(cpu_offset=0, gpu_offset=0)

    def apply_configuration(self, new_configuration: RyzenAdjConfiguration):
        ra_path = Path(decky_plugin.DECKY_PLUGIN_DIR, "bin", "ryzenadj")
        ra_cmd = [
            str(ra_path),
            f"--set-coall={new_configuration.cpu_value()}",
            f"--set-cogfx={new_configuration.gpu_value()}",
        ]
        ra_result = subprocess.run(ra_cmd, capture_output=True, text=True)
        # TODO: Check exit status and don't store new configuration in case of failure
        self.active_configuration = new_configuration
        return ra_cmd, ra_result


# `self` doesn't work as expected in the Plugin class
# as it is not properly inited by Decky Loader:
#     https://github.com/SteamDeckHomebrew/decky-loader/issues/509
class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def update_offsets(self, cpu_offset: int, gpu_offset: int):
        new_configuration = RyzenAdjConfiguration(
            cpu_offset=cpu_offset, gpu_offset=gpu_offset
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

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello from RyzenAdj!")
        self.rac = RyzenAdjConfigurer()

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye from RyzenAdj!")
