declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

interface SteamClientHook {
  unregister: () => void;
}

interface SteamClientSystem {
  RegisterForOnResumeFromSuspend: (callback: () => void) => SteamClientHook;
}

declare interface SteamClient {
  System: SteamClientSystem;
}
