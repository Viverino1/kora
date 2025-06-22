import { join } from 'path';
import { BrowserWindow, app, ipcMain, IpcMainEvent, screen } from 'electron';
import isDev from 'electron-is-dev';
import { startGoogleAuth } from './auth';

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const scale = 0.8;
  const minWidth = Math.floor(width * scale);
  const minHeight = Math.floor(minWidth * (height / width));
  const window = new BrowserWindow({
    width: minWidth,
    height: minHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  const port = process.env.VITE_DEV_PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../dist-vite/index.html');

  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }

  window.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
      } else {
        window.webContents.openDevTools({ mode: 'right' });
      }
      event.preventDefault();
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  ipcMain.on('minimize', () => {
    window.isMinimized() ? window.restore() : window.minimize();
  });
  ipcMain.on('maximize', () => {
    window.isMaximized() ? window.restore() : window.maximize();
  });
  ipcMain.on('close', () => {
    window.close();
  });
}

app.whenReady().then(async () => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('log', (_: IpcMainEvent, message: any) => {
  console.log(message);
});

ipcMain.on('set-fullscreen', (_, fullscreen) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.setFullScreen(fullscreen);
  }
});
ipcMain.on('toggle-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.setFullScreen(!win.isFullScreen());
  }
});
ipcMain.handle('is-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  return win ? win.isFullScreen() : false;
});

ipcMain.handle('start-google-auth', async (_) => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    startGoogleAuth(mainWindow);
  }
});
