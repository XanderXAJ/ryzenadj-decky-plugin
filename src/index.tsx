import {
  ButtonItem,
  definePlugin,
  DialogButton,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  SliderField,
  staticClasses,
} from "decky-frontend-lib";
import { useEffect, useState, VFC, StrictMode } from "react";
import { FaShip } from "react-icons/fa";

interface UpdateOffsetsMethodArgs {
  cpu_offset: number;
  gpu_offset: number;
}

const DEFAULT_CPU_OFFSET = 0;
const DEFAULT_GPU_OFFSET = 0;

const RyzenadjContent: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [CPUOffset, setCPUOffset] = useState(DEFAULT_CPU_OFFSET);
  const [GPUOffset, setGPUOffset] = useState(DEFAULT_GPU_OFFSET);
  const [result, setResult] = useState(0);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    const updateOffset = async () => {
      const result = await serverAPI.callPluginMethod<UpdateOffsetsMethodArgs, number>(
        "update_offsets",
        {
          cpu_offset: CPUOffset,
          gpu_offset: GPUOffset,
        }
      );
      console.log("Result:", result);
      if (result.success) {
        setResult(result.result);
      }
    }

    updateOffset();
  }, [CPUOffset, GPUOffset]);

  return (
    <PanelSection title="Panel Section">
      <PanelSectionRow>
        <SliderField
          label="CPU Offset" showValue={true}
          value={CPUOffset} min={0} max={30} step={1} validValues="range" resetValue={0}
          onChange={(newValue) => {
            console.log(`CPU Offset: ${newValue}`)
            setDebug(`CPU Offset: ${newValue}`);
            setCPUOffset(newValue);
          }} />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label="GPU Offset" showValue={true}
          value={GPUOffset} min={0} max={30} step={1} validValues="range" resetValue={0}
          onChange={(newValue) => {
            console.log(`GPU Offset: ${newValue}`)
            setDebug(`GPU Offset: ${newValue}`);
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
        Result: {result}
      </PanelSectionRow>
      <PanelSectionRow>
        Debug: {debug}
      </PanelSectionRow>
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
    title: <div className={staticClasses.Title}>Ryzenadj</div>,
    content:
      <StrictMode>
        <RyzenadjContent serverAPI={serverApi} />
      </StrictMode>,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
