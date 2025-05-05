// main.js

// Import karaganna ona modules
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu } = require('electron');
const path = require('path');

// App eka development mode ekeda production mode ekeda kiyala hoyaganna
const isDev = !app.isPackaged; // Pack karala nattam development

let mainWindow; // mainWindow variable eka function ekata pitathin define karagamu

// App window eka hadana function eka
function createWindow() {
    mainWindow = new BrowserWindow({ // Pitathin define karapu variable ekata assign karagamu
        width: 900,  // Window width eka
        height: 750, // Window height eka
        icon: path.join(__dirname, 'C:\\Users\\CHAMA COMPUTERS\\Downloads\\ss.png'), // ඔයාගේ icon file එකේ path එක මෙතන දෙන්න
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // preload script eka load kirima
            nodeIntegration: false, // Security walata meka false wennama ona
            contextIsolation: true, // Security walata meka true wennama ona
            // Production mode ekedi DevTools disable kirima
            devTools: isDev // Development mode ekedi witharak DevTools enable karanna
        }
    });

    // index.html file eka load kirima
    mainWindow.loadFile('index.html');

    // Production mode ekedi default menu eka (DevTools ekkath thiyena) ain kirima
    if (!isDev) {
         Menu.setApplicationMenu(null); // Menu ekama ain karanna (saralama kramaya)
         // Nathnam DevTools nathi minimal menu ekak hadanna puluwan
    }
}

// DevTools shortcuts disable kirima/wenas kirima (Production mode ekedi)
function disableOrModifyDevToolsShortcuts() {
    if (!isDev) {
        // F12 disable kirima
        globalShortcut.register('F12', () => {
            console.log('F12 (DevTools) is disabled in production.');
        });

        // Ctrl+Shift+I shortcut eka File Open dialog ekata maru kirima
        globalShortcut.register('CommandOrControl+Shift+I', async () => {
            console.log('Ctrl+Shift+I pressed in production. Opening file dialog...');
            if (!mainWindow || mainWindow.isDestroyed()) {
                console.error("Main window not available for shortcut dialog.");
                return;
            }
            try {
                // File open dialog eka pennanna (IPC handler eke logic ekama)
                const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'mka', 'ac3', 'ec3', 'amr'];
                const videoExtensions = ['mp4', 'webm', 'ogv', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'mpg', 'mpeg', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'divx', 'asf'];
                const playlistExtensions = ['m3u', 'm3u8', 'pls', 'wpl', 'zpl'];
                const allMediaExtensions = [...audioExtensions, ...videoExtensions];

                const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        { name: 'All Media Files', extensions: allMediaExtensions },
                        { name: 'Video Files', extensions: videoExtensions },
                        { name: 'Audio Files', extensions: audioExtensions },
                        { name: 'Playlist Files', extensions: playlistExtensions },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                // User file ekak select karoth, eke path eka renderer process ekata yawanna
                if (!canceled && filePaths.length > 0) {
                    const filePath = filePaths[0];
                    console.log('File selected via shortcut:', filePath);
                    mainWindow.webContents.send('set-file-path', filePath); // 'set-file-path' channel eka haraha yawanna
                }
            } catch (error) {
                console.error("Error showing open dialog from shortcut:", error);
            }
        });

         // Reload shortcuts disable kirima
         globalShortcut.register('CommandOrControl+R', () => {
            console.log('Ctrl+R (Reload) is disabled in production.');
         });
         globalShortcut.register('F5', () => {
            console.log('F5 (Reload) is disabled in production.');
         });

    } else {
        // Development mode ekedi: Ctrl+Shift+I walin DevTools open wenna ida denna
        globalShortcut.register('CommandOrControl+Shift+I', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.toggleDevTools();
            }
        });
         // Development mode ekedi reload shortcuts walata ida denna
         globalShortcut.register('CommandOrControl+R', () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
                 mainWindow.webContents.reload();
             }
         });
         globalShortcut.register('F5', () => {
             if (mainWindow && !mainWindow.isDestroyed()) {
                 mainWindow.webContents.reload();
             }
         });
    }
}

// App eka close karanakota shortcuts unregister kirima
function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}

// --- App Events ---

// Electron ready wunama window eka hadanna
app.whenReady().then(() => {
    createWindow();
    disableOrModifyDevToolsShortcuts(); // Shortcuts handle karana function eka call karanna

    // macOS walata activate event eka
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// App eka close karanna kalin shortcuts unregister karanna
app.on('will-quit', () => {
    unregisterShortcuts();
});

// Okkoma windows close wunama app eka quit karanna (macOS waladi hari)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handler (Open button ekata) ---
// Me function eka thiyenna ona Open button eka wada karanna
ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        console.error("Main window is not available for dialog.");
        return null;
    }
    try {
        // File types list eka (shortcut eke wage)
        const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'mka', 'ac3', 'ec3', 'amr'];
        const videoExtensions = ['mp4', 'webm', 'ogv', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'mpg', 'mpeg', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'divx', 'asf'];
        const playlistExtensions = ['m3u', 'm3u8', 'pls', 'wpl', 'zpl'];
        const allMediaExtensions = [...audioExtensions, ...videoExtensions];

        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'All Media Files', extensions: allMediaExtensions },
                { name: 'Video Files', extensions: videoExtensions },
                { name: 'Audio Files', extensions: audioExtensions },
                { name: 'Playlist Files', extensions: playlistExtensions },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!canceled && filePaths.length > 0) {
            return filePaths[0]; // Select karapu path eka return karanna
        }
    } catch (error) {
        console.error("Error showing open dialog from IPC:", error);
    }
    return null; // Cancel karoth ho error ekak awoth null return karanna
});
