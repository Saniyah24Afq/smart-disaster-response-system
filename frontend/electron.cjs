const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'RESQ — Smart Disaster Response',
    backgroundColor: '#f8fbfa',

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Hide Electron's default File / Edit / View / Window menu
  win.setMenuBarVisibility(false)

  // Load the production React build
  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // Optional debugging:
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})