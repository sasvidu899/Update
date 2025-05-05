const { contextBridge, ipcRenderer } = require('electron');

// Renderer process එකට ආරක්ෂිතව expose කරන දේවල්
contextBridge.exposeInMainWorld('electronAPI', {
  // Main process එකෙන් File Dialog එක ඉල්ලන function එක
  openFile: () => ipcRenderer.invoke('dialog:openFile')
  // ඔයාට තව functions මෙතනින් expose කරන්න පුළුවන්
});