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
import { useState, VFC } from "react";
import { FaShip } from "react-icons/fa";

interface AddMethodArgs {
  left: number;
  right: number;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [CPUOffset, setCPUOffset] = useState(0);
  const [GPUOffset, setGPUOffset] = useState(0);
  const [result, setResult] = useState(0);

  const onOffsetUpdate = async () => {
    const result = await serverAPI.callPluginMethod<AddMethodArgs, number>(
      "add",
      {
        left: CPUOffset,
        right: GPUOffset,
      }
    );
    if (result.success) {
      setResult(result.result);
    }
  };

  return (
    <PanelSection title="Panel Section">
      <PanelSectionRow>
        <SliderField value={CPUOffset} min={0} max={30} step={1} showValue={true} validValues={"range"}
          onChange={(newValue) => {
            setCPUOffset(newValue);
            onOffsetUpdate();
          }} />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField value={GPUOffset} min={0} max={30} step={1} showValue={true} validValues={"range"}
          onChange={(newValue) => {
            setGPUOffset(newValue);
            onOffsetUpdate();
          }} />
      </PanelSectionRow>
      <PanelSectionRow>
        Result: {result}
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
    title: <div className={staticClasses.Title}>Example Plugin</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
