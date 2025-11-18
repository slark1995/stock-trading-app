import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => '1.0.0',
  getPlatform: () => process.platform,
});

