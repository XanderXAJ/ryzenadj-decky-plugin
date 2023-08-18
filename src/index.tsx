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
import { useEffect, useState, VFC, StrictMode, Fragment } from "react";
import { FaBolt } from "react-icons/fa6";

type State = {
  apply_cpu_offset: boolean;
  cpu_offset: number;
  apply_gpu_offset: boolean;
  gpu_offset: number;
  show_debug: boolean;
}

interface RyzenAdjDetailsResponse {
  ryzenadj_cmd: string;
  ryzenadj_stderr: string;
  ryzenadj_stdout: string;
  timestamp: string;
}
interface RyzenAdjWasExecutedResponse {
  ryzenadj_executed: true;
  ryzenadj_details: RyzenAdjDetailsResponse;
}
interface RyzenAdjNotExecutedResponse {
  ryzenadj_executed: false;
  ryzenadj_details: undefined;
}
type RyzenAdjExecutedResponse = RyzenAdjWasExecutedResponse | RyzenAdjNotExecutedResponse;

interface UpdateOffsetsParams {
  config: State
}
type UpdateOffsetsResponse = State & RyzenAdjExecutedResponse;

const DEFAULT_STATE: State = {
  apply_cpu_offset: true,
  cpu_offset: 0,
  apply_gpu_offset: false,
  gpu_offset: 0,
  show_debug: false,
}
const DEFAULT_CPU_OFFSET = 0;
const DEFAULT_GPU_OFFSET = 0;

const RyzenadjResult: VFC<{ result: ServerResponse<any> | undefined }> = ({ result }) => {
  if (result === undefined) {
    return null
  }
  if (!result.success) {
    return (
      <PanelSectionRow>
        Failed to set offsets: {result.result}
      </PanelSectionRow>
    )
  }
  return null;
};

const RyzenAdjDebug: VFC<{ details: RyzenAdjDetailsResponse | undefined }> = ({ details }) => {
  if (details === undefined)
    return <PanelSectionRow>RyzenAdj has not been executed yet</PanelSectionRow>
  return (
    <Fragment>
      <PanelSectionRow>Time: {details.timestamp}</PanelSectionRow>
      <PanelSectionRow>cmd: {details.ryzenadj_cmd}</PanelSectionRow>
      <PanelSectionRow>stdout: {details.ryzenadj_stdout}</PanelSectionRow>
      <PanelSectionRow>stderr: {details.ryzenadj_stderr}</PanelSectionRow>
    </Fragment>
  )
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
  const [state, setState] = useState<State | undefined>(undefined);
  const [ryzenadjDetails, setRyzenadjDetails] = useState<RyzenAdjDetailsResponse | undefined>(undefined);
  const [result, setResult] = useState<ServerResponse<UpdateOffsetsResponse> | undefined>(undefined);

  useEffect(() => {
    // Initialise configuration
    if (state !== undefined) return;

    const initState = async () => {
      const resp = await serverAPI.callPluginMethod<{}, State>(
        "active_state",
        {}
      );
      console.log("active_state response:", resp);
      if (resp.success) {
        setState(resp.result);
      }
    }

    initState();
  }, []); // run once on initialisation

  useEffect(() => {
    // Update configuration
    if (state === undefined) return;

    const updateRyzenadjConfig = async () => {
      const response = await serverAPI.callPluginMethod<UpdateOffsetsParams, UpdateOffsetsResponse>(
        "update_ryzenadj_config",
        {
          config: state
        }
      );
      console.log("update_ryzenadj_config response:", response);

      if (response.success) {
        if (response.result.ryzenadj_executed) {
          setRyzenadjDetails(response.result.ryzenadj_details)
        }
      }
      setResult(response);
    }

    updateRyzenadjConfig();
  }, [state]);

  if (state === undefined) {
    return (
      <Delayed delayMs={600}>
        <SteamSpinner />
      </Delayed>
    )
  } else {
    return (
      <PanelSection>
        <PanelSectionRow>
          <ToggleField label="Apply CPU Offset" checked={state.apply_cpu_offset}
            onChange={(newValue) => {
              setState({
                ...state,
                apply_cpu_offset: newValue
              })
            }} />
        </PanelSectionRow>
        {state.apply_cpu_offset &&
          <PanelSectionRow>
            <SliderField
              label="CPU Offset" showValue={true}
              value={state.cpu_offset} min={-30} max={0} step={1} validValues="range" resetValue={DEFAULT_CPU_OFFSET}
              onChange={(newValue) => {
                console.log(`CPU Offset: ${newValue}`)
                setState({
                  ...state,
                  cpu_offset: newValue,
                })
              }} />
          </PanelSectionRow>}
        <PanelSectionRow>
          <ToggleField label="Apply GPU Offset" checked={state.apply_gpu_offset}
            onChange={(newValue) => {
              setState({
                ...state,
                apply_gpu_offset: newValue
              })
            }} />
        </PanelSectionRow>
        {state.apply_gpu_offset &&
          <PanelSectionRow>
            <SliderField
              label="GPU Offset" showValue={true}
              value={state.gpu_offset} min={-30} max={0} step={1} validValues="range" resetValue={DEFAULT_GPU_OFFSET}
              onChange={(newValue) => {
                console.log(`GPU Offset: ${newValue}`)
                setState({
                  ...state,
                  gpu_offset: newValue,
                })
              }} />
          </PanelSectionRow>}
        <PanelSectionRow>
          <ButtonItem
            onClick={() => {
              setState(DEFAULT_STATE)
            }}>
            Reset All
          </ButtonItem>
        </PanelSectionRow>
        <RyzenadjResult result={result} />
        <PanelSectionRow>
          <ToggleField label="Show Debug Information" checked={state.show_debug}
            onChange={(newValue) => {
              setState({
                ...state,
                show_debug: newValue
              })
            }} />
        </PanelSectionRow>
        {state.show_debug && <RyzenAdjDebug details={ryzenadjDetails} />}
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
