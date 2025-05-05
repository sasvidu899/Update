// main.js

// Add this line at the very top for auto-update
require('update-electron-app')();

// Import necessary modules
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu } = require('electron');
const path = require('path'); // Keep path module

// Determine if the app is running in development or production
const isDev = !app.isPackaged;

let mainWindow;

// Define the icon path using escaped backslashes (WARNING: Not recommended)
// Make sure this file actually exists at this exact path
const iconPath = "C:\\Users\\CHAMA COMPUTERS\\Downloads\\ss.png"; // Use .png for window icon generally

// App window creation function
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 750,
        // --- Use the defined absolute path ---
        icon: iconPath, // Use the variable defined above
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: isDev
        }
    });

    mainWindow.loadFile('index.html');

    // Disable menu in production
    if (!isDev) {
         Menu.setApplicationMenu(null);
    }
}

// Function to disable/modify DevTools shortcuts
function disableOrModifyDevToolsShortcuts() {
    if (!isDev) {
        globalShortcut.register('F12', () => {});
        globalShortcut.register('CommandOrControl+Shift+I', async () => {
            // ... (File open logic remains the same) ...
            if (!mainWindow || mainWindow.isDestroyed()) return;
            try {
                const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'mka', 'ac3', 'ec3', 'amr'];
                const videoExtensions = ['mp4', 'webm', 'ogv', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'mpg', 'mpeg', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'divx', 'asf'];
                const playlistExtensions = ['m3u', 'm3u8', 'pls', 'wpl', 'zpl'];
                const allMediaExtensions = [...audioExtensions, ...videoExtensions];
                const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                    properties: ['openFile'], filters: [ { name: 'All Media Files', extensions: allMediaExtensions }, { name: 'Video Files', extensions: videoExtensions }, { name: 'Audio Files', extensions: audioExtensions }, { name: 'Playlist Files', extensions: playlistExtensions }, { name: 'All Files', extensions: ['*'] } ]
                });
                if (!canceled && filePaths.length > 0) { mainWindow.webContents.send('set-file-path', filePaths[0]); }
            } catch (error) { console.error("Error showing open dialog from shortcut:", error); }
        });
        globalShortcut.register('CommandOrControl+R', () => {});
        globalShortcut.register('F5', () => {});
    } else {
        // Allow DevTools and Reload in development
        globalShortcut.register('CommandOrControl+Shift+I', () => { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.toggleDevTools(); } });
        globalShortcut.register('CommandOrControl+R', () => { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.reload(); } });
        globalShortcut.register('F5', () => { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.webContents.reload(); } });
    }
}

// Function to unregister shortcuts
function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}

// --- App Events ---
app.whenReady().then(() => {
    createWindow();
    disableOrModifyDevToolsShortcuts();
    app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('will-quit', unregisterShortcuts);
app.on('window-all-closed', function () { if (process.platform !== 'darwin') app.quit(); });

// --- IPC Handler for File Dialog ---
ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    try {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'mka', 'ac3', 'ec3', 'amr'];
        const videoExtensions = ['mp4', 'webm', 'ogv', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'mpg', 'mpeg', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'divx', 'asf'];
        const playlistExtensions = ['m3u', 'm3u8', 'pls', 'wpl', 'zpl'];
        const allMediaExtensions = [...audioExtensions, ...videoExtensions];
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'], filters: [ { name: 'All Media Files', extensions: allMediaExtensions }, { name: 'Video Files', extensions: videoExtensions }, { name: 'Audio Files', extensions: audioExtensions }, { name: 'Playlist Files', extensions: playlistExtensions }, { name: 'All Files', extensions: ['*'] } ]
        });
        if (!canceled && filePaths.length > 0) { return filePaths[0]; }
    } catch (error) { console.error("Error showing open dialog from IPC:", error); }
    return null;
});
