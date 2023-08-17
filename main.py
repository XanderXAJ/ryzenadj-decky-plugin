from dataclasses import dataclass
from pathlib import Path
import subprocess
from typing import ClassVar, Generic, TypeVar

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin


T = TypeVar("T")


@dataclass
class ChangedValue(Generic[T]):
    old: T
    new: T


@dataclass
class RyzenAdjConfiguration:
    apply_cpu_offset: bool
    cpu_offset: int
    apply_gpu_offset: bool
    gpu_offset: int
    show_debug: bool

    BASE_CPU: ClassVar[int] = 0x100000
    BASE_GPU: ClassVar[int] = 0x100000

    def __post_init__(self):
        # Protect against potential overvolting, at least until there is a use case
        if self.cpu_offset > 0:
            self.cpu_offset = 0
        if self.gpu_offset > 0:
            self.gpu_offset = 0

    def cpu_value(self) -> str:
        return hex(self.BASE_CPU + self.cpu_offset)

    def gpu_value(self) -> str:
        return hex(self.BASE_GPU + self.gpu_offset)

    def compare_to_new(self, new: "RyzenAdjConfiguration") -> dict[str, ChangedValue]:
        if self == new:
            return {}

        differences = {}

        # I could probably do some metaprogramming here but I'm not sure that would be as clear...
        if self.apply_cpu_offset != new.apply_cpu_offset:
            differences["apply_cpu_offset"] = ChangedValue[int](
                old=self.apply_cpu_offset, new=new.apply_cpu_offset
            )
        if self.cpu_offset != new.cpu_offset:
            differences["cpu_offset"] = ChangedValue[int](
                old=self.cpu_offset, new=new.cpu_offset
            )
        if self.apply_gpu_offset != new.apply_gpu_offset:
            differences["apply_gpu_offset"] = ChangedValue[bool](
                old=self.apply_gpu_offset, new=new.apply_gpu_offset
            )
        if self.gpu_offset != new.gpu_offset:
            differences["gpu_offset"] = ChangedValue[bool](
                old=self.gpu_offset, new=new.gpu_offset
            )

        return differences


class RyzenAdjConfigurer:
    def __init__(self, ra_path: Path, initial_config: RyzenAdjConfiguration) -> None:
        # TODO: Accept previous successful configuration
        self.ra_path = ra_path
        self.active_configuration = None  # Set up when configuration applied
        self.apply_force_configuration(initial_config)

    @staticmethod
    def generate_full_ra_flags(config: RyzenAdjConfiguration) -> list[str]:
        flags: dict[str, str] = {}

        if config.apply_cpu_offset:
            flags["--set-coall"] = config.cpu_value()

        if config.apply_gpu_offset:
            flags["--set-gfxall"] = config.gpu_value()

        return [f"{k}={v}" for k, v in flags.items()]

    @staticmethod
    def generate_delta_ra_flags(
        new: RyzenAdjConfiguration, differences: dict[str, ChangedValue]
    ) -> list[str]:
        flags: dict[str, str] = {}

        # Apply changed CPU offset if enabled
        if "cpu_offset" in differences and new.apply_cpu_offset:
            flags["--set-coall"] = new.cpu_value()

        # If CPU offset just enabled, re-apply previously configured offset
        if "apply_cpu_offset" in differences and new.apply_cpu_offset:
            flags["--set-coall"] = new.cpu_value()

        # If CPU offset just disabled, reset CPU offset to default
        if "apply_cpu_offset" in differences and not new.apply_cpu_offset:
            flags["--set-coall"] = "0x100000"

        # Apply changed GPU offset if enabled
        if "gpu_offset" in differences and new.apply_gpu_offset:
            flags["--set-cogfx"] = new.gpu_value()

        # If GPU offset just enabled, re-apply previously configured offset
        if "apply_gpu_offset" in differences and new.apply_gpu_offset:
            flags["--set-cogfx"] = new.gpu_value()

        # If GPU offset just disabled, reset GPU offset to default
        if "apply_gpu_offset" in differences and not new.apply_gpu_offset:
            flags["--set-cogfx"] = "0x100000"

        return [f"{k}={v}" for k, v in flags.items()]

    def apply_new_configuration(self, new_configuration: RyzenAdjConfiguration):
        config_diff = self.active_configuration.compare_to_new(new_configuration)
        # TODO: Do nothing if no changes occurred

        decky_plugin.logger.info("config_diff: %s", config_diff)
        ra_flags = self.generate_delta_ra_flags(new_configuration, config_diff)
        result = self.__exec_ra(ra_flags)
        # TODO: Check exit status and don't store new configuration in case of failure
        self.active_configuration = new_configuration
        return result

    def apply_force_configuration(self, configuration: RyzenAdjConfiguration):
        ra_flags = self.generate_full_ra_flags(configuration)
        result = self.__exec_ra(ra_flags)
        # TODO: Check exit status and don't store new configuration in case of failure
        self.active_configuration = configuration
        return result

    def reapply_configuration(self):
        decky_plugin.logger.info("Reapplying active configuration")
        # FIX: This isn't going to work with the change detection
        return self.apply_force_configuration(self.active_configuration)

    def __exec_ra(self, ra_flags: list[str]):
        decky_plugin.logger.info("ra_flags: %s", ra_flags)
        ra_cmd = [
            str(self.ra_path),
            *ra_flags,
        ]
        decky_plugin.logger.info("ra_cmd: %s", ra_cmd)
        ra_result = subprocess.run(ra_cmd, capture_output=True, text=True)
        decky_plugin.logger.info("Applied configuration: %s", ra_result)
        # TODO: Check exit status and don't store new configuration in case of failure
        return ra_cmd, ra_result


# `self` doesn't work as expected in the Plugin class
# as it is not properly inited by Decky Loader:
#     https://github.com/SteamDeckHomebrew/decky-loader/issues/509
class Plugin:
    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def update_ryzenadj_config(self, config: dict):
        new_configuration = RyzenAdjConfiguration(**config)
        ra_cmd, ra_result = self.rac.apply_new_configuration(new_configuration)
        config = self.rac.active_configuration

        response = {
            "apply_cpu_offset": config.apply_cpu_offset,
            "cpu_offset": config.cpu_offset,
            "cpu_value": config.cpu_value(),
            "apply_gpu_offset": config.apply_gpu_offset,
            "gpu_offset": config.gpu_offset,
            "gpu_value": config.gpu_value(),
            "ryzenadj_cmd": " ".join(ra_cmd),
            "ryzenadj_stderr": ra_result.stderr,
            "ryzenadj_stdout": ra_result.stdout,
        }
        decky_plugin.logger.info("update_offsets response: %s", response)
        return response

    async def active_state(self):
        config = self.rac.active_configuration

        return {
            "apply_cpu_offset": config.apply_cpu_offset,
            "cpu_offset": config.cpu_offset,
            "apply_gpu_offset": config.apply_gpu_offset,
            "gpu_offset": config.gpu_offset,
            "show_debug": config.show_debug,
        }

    async def on_resume_from_suspend(self):
        decky_plugin.logger.info("Resumed from sleep, reapplying configuration")
        self.rac.reapply_configuration()

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello from RyzenAdj!")
        self.rac = RyzenAdjConfigurer(
            ra_path=Path(decky_plugin.DECKY_PLUGIN_DIR, "bin", "ryzenadj"),
            initial_config=RyzenAdjConfiguration(
                apply_cpu_offset=True,
                cpu_offset=0,
                apply_gpu_offset=False,
                gpu_offset=0,
                show_debug=False,
            ),
        )

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye from RyzenAdj!")
