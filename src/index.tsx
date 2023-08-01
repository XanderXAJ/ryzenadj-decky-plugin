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

const DEFAULT_CPU_OFFSET = 0;
const DEFAULT_GPU_OFFSET = 0;

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
}

const RyzenAdjDebug: VFC<{ result: ServerResponse<UpdateOffsetsResponse> | undefined }> = ({ result }) => {
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
}

const RyzenAdjContent: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [CPUOffset, setCPUOffset] = useState<number | undefined>(undefined);
  const [GPUOffset, setGPUOffset] = useState<number | undefined>(undefined);
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

  if (CPUOffset === undefined || GPUOffset == undefined) {
    return (
      <SteamSpinner />
    )
  } else {
    return (
      <PanelSection>
        <PanelSectionRow>
          <SliderField
            label="CPU Offset" showValue={true}
            value={CPUOffset} min={-30} max={0} step={1} validValues="range" resetValue={0}
            onChange={(newValue) => {
              console.log(`CPU Offset: ${newValue}`)
              setCPUOffset(newValue);
            }} />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            label="GPU Offset" showValue={true}
            value={GPUOffset} min={-30} max={0} step={1} validValues="range" resetValue={0}
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

  return {
    title: <div className={staticClasses.Title}>RyzenAdj</div>,
    content:
      <StrictMode>
        <RyzenAdjContent serverAPI={serverApi} />
      </StrictMode>,
    icon: <FaBolt />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
