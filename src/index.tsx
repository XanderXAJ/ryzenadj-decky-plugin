import {
  ButtonItem,
  definePlugin,
  DialogButton,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  ServerResponse,
  SliderField,
  staticClasses,
  SteamSpinner,
  ToggleField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC, StrictMode } from "react";
import { FaBolt } from "react-icons/fa6";

interface UpdateOffsetsMethodArgs {
  cpu_offset: number;
  gpu_offset: number;
}

interface UpdateOffsetsResponse {
  cpu_offset: number;
  gpu_offset: number;
  cpu_value: string;
  gpu_value: string;
  ryzenadj_cmd: string;
  ryzenadj_stderr: string;
  ryzenadj_stdout: string;
}

interface ActiveStateResponse {
  cpu_offset: number;
  gpu_offset: number;
}

interface UpdateAPUPowerLimitsParams {
  limit_mW: number;
}

interface UpdateAPUPowerLimitsResponse {
  limit_mW: number;
  ryzenadj_cmd: string;
  ryzenadj_stderr: string;
  ryzenadj_stdout: string;
}

interface RyzenAdjDetailsResponse {
  ryzenadj_cmd: string;
  ryzenadj_stderr: string;
  ryzenadj_stdout: string;
}

const DEFAULT_CPU_OFFSET = 0;
const DEFAULT_GPU_OFFSET = 0;
const DEFAULT_APU_POWER_LIMIT_MW = 15000;

const RyzenadjResult: VFC<{ result: ServerResponse<UpdateOffsetsResponse> | undefined }> = ({ result }) => {
  if (result === undefined) {
    return null
  }
  if (result.success) {
    return (
      <PanelSectionRow>
        Successfully set offsets:<br />
        CPU: {result.result?.cpu_offset}<br />
        GPU: {result.result?.gpu_offset}
      </PanelSectionRow>
    )
  } else {
    return (
      <PanelSectionRow>
        Failed to set offsets: {result.result}
      </PanelSectionRow>
    )
  }
};

const RyzenAdjDebug: VFC<{ result: ServerResponse<RyzenAdjDetailsResponse> | undefined }> = ({ result }) => {
  if (result === undefined)
    return <PanelSectionRow>Result currently undefined</PanelSectionRow>
  if (!result.success)
    return <PanelSectionRow>Result unsuccessful -- see above</PanelSectionRow>
  if (result.success) {
    return (
      <PanelSectionRow>
        <p>cmd: {result.result.ryzenadj_cmd}</p>
        <p>stdout: {result.result.ryzenadj_stdout}</p>
        <p>stderr: {result.result.ryzenadj_stderr}</p>
      </PanelSectionRow>
    )
  }
  return null
};

type DelayedProps = {
  delayMs: number;
  children?: React.ReactNode;
}

// Delay rendering the children to avoid flickering upon quick requests/loading operations
const Delayed: VFC<DelayedProps> = ({ children, delayMs }) => {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    const wait = setTimeout(() => {
      setShow(true);
    }, delayMs);
    return () => clearTimeout(wait);
  }, [delayMs]);

  return show ? <div>{children}</div> : null;
};

const RyzenAdjContent: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [CPUOffset, setCPUOffset] = useState<number | undefined>(undefined);
  const [GPUOffset, setGPUOffset] = useState<number | undefined>(undefined);
  const [APUPowerLimitmW, setAPUPowerLimitmW] = useState<number>(DEFAULT_APU_POWER_LIMIT_MW);
  const [result, setResult] = useState<ServerResponse<UpdateOffsetsResponse> | undefined>(undefined);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  useEffect(() => {
    // Initialise configuration
    if (CPUOffset !== undefined && GPUOffset !== undefined) return;

    const initState = async () => {
      const resp = await serverAPI.callPluginMethod<{}, ActiveStateResponse>(
        "active_state",
        {}
      );
      console.log("active_state response:", resp);
      if (resp.success) {
        setCPUOffset(resp.result.cpu_offset);
        setGPUOffset(resp.result.gpu_offset);
      }
    }

    initState();
  }, []); // run once on initialisation

  useEffect(() => {
    // Update configuration
    if (CPUOffset === undefined || GPUOffset === undefined) return;

    const updateOffsets = async () => {
      const response = await serverAPI.callPluginMethod<UpdateOffsetsMethodArgs, UpdateOffsetsResponse>(
        "update_offsets",
        {
          cpu_offset: CPUOffset,
          gpu_offset: GPUOffset,
        }
      );
      console.log("update_offsets response:", response);
      setResult(response);
    }

    updateOffsets();
  }, [CPUOffset, GPUOffset]);

  useEffect(() => {
    // Update APU power limits
    const update = async () => {
      const response = await serverAPI.callPluginMethod<UpdateAPUPowerLimitsParams, UpdateAPUPowerLimitsResponse>(
        "update_apu_power_limits",
        {
          limit_mW: APUPowerLimitmW,
        }
      );
      console.log("update_apu_power_limits response:", response);
    };

    update();
  }, [APUPowerLimitmW]);

  if (CPUOffset === undefined || GPUOffset == undefined) {
    return (
      <Delayed delayMs={600}>
        <SteamSpinner />
      </Delayed>
    )
  } else {
    return (
      <PanelSection>
        <PanelSectionRow>
          <SliderField
            label="CPU Offset" showValue={true}
            value={CPUOffset} min={-30} max={0} step={1} validValues="range" resetValue={DEFAULT_CPU_OFFSET}
            onChange={(newValue) => {
              console.log(`CPU Offset: ${newValue}`)
              setCPUOffset(newValue);
            }} />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="GPU Offset" showValue={true}
            value={GPUOffset} min={-30} max={0} step={1} validValues="range" resetValue={DEFAULT_GPU_OFFSET}
            onChange={(newValue) => {
              console.log(`GPU Offset: ${newValue}`)
              setGPUOffset(newValue);
            }} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            onClick={() => {
              setCPUOffset(DEFAULT_CPU_OFFSET);
              setGPUOffset(DEFAULT_GPU_OFFSET);
            }}>
            Reset All
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="APU Power Limit" showValue={true} valueSuffix="mW"
            value={APUPowerLimitmW} min={1000} max={15000} step={500} validValues="range" resetValue={DEFAULT_APU_POWER_LIMIT_MW} editableValue={true}
            onChange={(newValue) => {
              setAPUPowerLimitmW(newValue);
            }}
          />
        </PanelSectionRow>
        <RyzenadjResult result={result} />
        <PanelSectionRow>
          <ToggleField label="Show Debug Information" checked={showDebug} onChange={setShowDebug} />
        </PanelSectionRow>
        {showDebug && <RyzenAdjDebug result={result} />}
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/decky-plugin-test");
            }}
          >
            Router
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }
};

const DeckyPluginRouterTest: VFC = () => {
  return (
    <div style={{ marginTop: "50px", color: "white" }}>
      Hello World!
      <DialogButton onClick={() => Router.NavigateToLibraryTab()}>
        Go to Library
      </DialogButton>
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  serverApi.routerHook.addRoute("/decky-plugin-test", DeckyPluginRouterTest, {
    exact: true,
  });

  const resumeHook = SteamClient.System.RegisterForOnResumeFromSuspend(() => {
    serverApi.callPluginMethod("on_resume_from_suspend", {});
  });

  return {
    title: <div className={staticClasses.Title}>RyzenAdj</div>,
    content:
      <StrictMode>
        <RyzenAdjContent serverAPI={serverApi} />
      </StrictMode>,
    icon: <FaBolt />,
    alwaysRender: true, // Prevent UI flashing when plugin is active but QAM is closed then re-opened
    onDismount() {
      resumeHook!.unregister();
      serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
