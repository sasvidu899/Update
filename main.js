require('update-electron-app')();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
       // Renderer process එකට Node.js/Electron APIs expose කරන්න preload script එකක්
       preload: path.join(__dirname, 'preload.js')
    }
  });

  // index.html file එක load කරනවා
  mainWindow.loadFile('index.html');

  // Developer Tools open කරන්න (ඕන නම්)
  // mainWindow.webContents.openDevTools();
}

// Electron ලෑස්ති උනාම window එක හදනවා
app.whenReady().then(() => {
  createWindow();

  // macOS වල dock icon එක click කලාම window එකක් හදනවා (ඇප් එක close වෙලා නැත්නම්)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Windows ඔක්කොම close උනාම ඇප් එක quit කරනවා (macOS ඇරෙන්න)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- Media Player Specific ---
// Renderer එකෙන් එන request එකට File Open Dialog එක පෙන්නන හැටි
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] },
          { name: 'Video Files', extensions: ['mp4', 'webm', 'ogv'] },
          { name: 'All Files', extensions: ['*'] }
      ]
  });
  if (!canceled) {
    return filePaths[0]; // තෝරගත්ත file එකේ path එක return කරනවා
  }
  return null;
});