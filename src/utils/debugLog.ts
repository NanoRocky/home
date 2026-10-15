import { mainStore } from "@/store";

let store: ReturnType<typeof mainStore> | null = null;

export const devLog = (moduleName: string, ...args: any[]) => {
  if (!import.meta.env.DEV) return;
  if (!store) store = mainStore();
  if (store.setV && store.devDebugLog) {
    console.log(`[${moduleName}]`, ...args);
  }
};
