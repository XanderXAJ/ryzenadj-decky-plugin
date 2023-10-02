from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import subprocess
from typing import ClassVar, Generic, Tuple, TypeVar

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin


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

    def compare_to_old(self, old: "RyzenAdjConfiguration") -> list[str]:
        if self == old:
            return []

        fields_to_compare = [
            "apply_cpu_offset",
            "cpu_offset",
            "apply_gpu_offset",
            "gpu_offset",
        ]

        if old == None:
            return fields_to_compare

        differences = []
        for field in fields_to_compare:
            if getattr(self, field) != getattr(old, field):
                differences.append(field)

        return differences


@dataclass
class RyzenAdjResult:
    cmd: list[str]
    returncode: int
    stdout: str
    stderr: str
    timestamp: datetime


class RyzenAdjConfigurer:
    def __init__(self, ra_path: Path, initial_config: RyzenAdjConfiguration) -> None:
        # TODO: Accept previous successful configuration
        self.ra_path = ra_path
        self.active_configuration = initial_config

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
        new: RyzenAdjConfiguration,
        old: RyzenAdjConfiguration,
        differences: list[str],
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

    def apply_configuration_delta(
        self, new_configuration: RyzenAdjConfiguration
    ) -> Tuple[bool, RyzenAdjResult | None]:
        config_diff = new_configuration.compare_to_old(self.active_configuration)
        # Do nothing if no changes occurred
        if len(config_diff) == 0:
            return False, None

        decky_plugin.logger.info("config_diff: %s", config_diff)
        ra_flags = self.generate_delta_ra_flags(
            new_configuration, self.active_configuration, config_diff
        )
        # Do nothing if changes didn't result in any flags
        if len(ra_flags) == 0:
            return False, None

        result = self.__exec_ra(ra_flags)
        # Check exit status and don't store new configuration in case of failure
        if result.returncode == 0:
            self.active_configuration = new_configuration
        return True, result

    def apply_configuration_full(
        self, configuration: RyzenAdjConfiguration
    ) -> Tuple[bool, RyzenAdjResult]:
        ra_flags = self.generate_full_ra_flags(configuration)
        result = self.__exec_ra(ra_flags)
        # Check exit status and don't store new configuration in case of failure
        if result.returncode == 0:
            self.active_configuration = configuration
        return True, result

    def reapply_configuration(
        self,
    ) -> Tuple[bool, RyzenAdjResult]:
        decky_plugin.logger.info("Reapplying active configuration")
        return self.apply_configuration_full(self.active_configuration)

    def __exec_ra(self, ra_flags: list[str]) -> RyzenAdjResult:
        decky_plugin.logger.info("ra_flags: %s", ra_flags)
        ra_cmd = [
            str(self.ra_path),
            *ra_flags,
        ]
        decky_plugin.logger.info("ra_cmd: %s", ra_cmd)
        ra_result = subprocess.run(ra_cmd, capture_output=True, text=True)
        decky_plugin.logger.info("Applied configuration: %s", ra_result)
        return RyzenAdjResult(
            cmd=ra_cmd,
            returncode=ra_result.returncode,
            stderr=ra_result.stderr,
            stdout=ra_result.stdout,
            timestamp=datetime.today(),
        )


DEFAULT_RYZENADJ_CONFIG = RyzenAdjConfiguration(
    apply_cpu_offset=True,
    cpu_offset=0,
    apply_gpu_offset=False,
    gpu_offset=0,
    show_debug=False,
)


class LifecycleManager:
    def __init__(self) -> None:
        self.first_update = True

    def first_update_done(self) -> bool:
        current = self.first_update
        self.first_update = False
        return current

    def system_crashed(self) -> bool:
        return True


# `self` doesn't work as expected in the Plugin class
# as it is not properly inited by Decky Loader:
#     https://github.com/SteamDeckHomebrew/decky-loader/issues/509
class Plugin:
    lm: LifecycleManager
    rac: RyzenAdjConfigurer

    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def update_ryzenadj_config(self, config: dict):
        decky_plugin.logger.info("request: update_ryzenadj_config")
        new_configuration = RyzenAdjConfiguration(**config)
        ra_executed, ra_result = self.rac.apply_configuration_delta(new_configuration)
        ra_config = self.rac.active_configuration

        ra_details = None
        if ra_executed:
            ra_details = {
                "ryzenadj_cmd": " ".join(ra_result.cmd),
                "ryzenadj_stderr": ra_result.stderr,
                "ryzenadj_stdout": ra_result.stdout,
                "timestamp": ra_result.timestamp.isoformat(timespec="milliseconds"),
            }

        response = {
            "apply_cpu_offset": ra_config.apply_cpu_offset,
            "cpu_offset": ra_config.cpu_offset,
            "cpu_value": ra_config.cpu_value(),
            "apply_gpu_offset": ra_config.apply_gpu_offset,
            "gpu_offset": ra_config.gpu_offset,
            "gpu_value": ra_config.gpu_value(),
            "ryzenadj_executed": ra_executed,
            "ryzenadj_details": ra_details,
        }
        decky_plugin.logger.info("update_offsets response: %s", response)
        return response

    async def active_state(self):
        decky_plugin.logger.info("request: active_state")
        config = self.rac.active_configuration

        return {
            "first_update": self.lm.first_update_done(),
            "state": {
                "apply_cpu_offset": config.apply_cpu_offset,
                "cpu_offset": config.cpu_offset,
                "apply_gpu_offset": config.apply_gpu_offset,
                "gpu_offset": config.gpu_offset,
                "show_debug": config.show_debug,
            },
        }

    async def on_resume_from_suspend(self):
        decky_plugin.logger.info("request: on_resume_from_suspend")
        decky_plugin.logger.info("Resumed from sleep, reapplying configuration")
        self.rac.reapply_configuration()

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello from RyzenAdj!")
        self.lm = LifecycleManager()
        self.rac = RyzenAdjConfigurer(
            ra_path=Path(decky_plugin.DECKY_PLUGIN_DIR, "bin", "ryzenadj"),
            initial_config=DEFAULT_RYZENADJ_CONFIG,
        )
        self.rac.apply_configuration_full(DEFAULT_RYZENADJ_CONFIG)

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye from RyzenAdj!")
