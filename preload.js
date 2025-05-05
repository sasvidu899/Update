// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Renderer process එකට ආරක්ෂිතව expose කරන දේවල්
contextBridge.exposeInMainWorld('electronAPI', {
  // Main process එකෙන් File Dialog එක ඉල්ලන function එක (මේක තියෙන්න ඕන)
  openFile: () => ipcRenderer.invoke('dialog:openFile')
});

// Main process එකෙන් එන 'set-file-path' message එක අහන් ඉන්න function එකක් expose කරනවා
contextBridge.exposeInMainWorld('ipcRendererEvents', {
  onSetFilePath: (callback) => ipcRenderer.on('set-file-path', (event, filePath) => callback(filePath))
  // ඔයාට තව messages අහන් ඉන්න ඕන නම් ඒවාටත් functions මෙතනින් expose කරන්න පුළුවන්
});
