import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  on: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.on(channel, listener),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
});

const api = {
  log: (message: string) => {
    ipcRenderer.send('log', message);
  },
  minimize: () => {
    ipcRenderer.send('minimize');
  },
  maximize: () => {
    ipcRenderer.send('maximize');
  },
  close: () => {
    ipcRenderer.send('close');
  },
  setFullscreen: (fullscreen: boolean) => {
    ipcRenderer.send('set-fullscreen', fullscreen);
  },
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen')
};

contextBridge.exposeInMainWorld('api', api);

const store = {
  get: async (key: string) => await ipcRenderer.invoke('store-get', key),
  set: (key: string, value: string) => ipcRenderer.send('store-set', key, value),
  delete: (key: string) => ipcRenderer.send('store-delete', key),
  clear: () => ipcRenderer.send('store-clear')
};

contextBridge.exposeInMainWorld('store', store);

declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    api: typeof api;
    store: typeof store;
  }
}
