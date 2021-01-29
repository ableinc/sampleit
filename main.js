const { app, shell, BrowserWindow } = require('electron')

if (process.env.ELECTRON_NODE_ENV === 'development')  {
  try {
    require('electron-reloader')(module)
  } catch (_) {}
}

function createWindow () {
  const win = new BrowserWindow({
    width: 320,
    height: 450,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('views/popup.html')
  
  // Open the DevTools. 
  if (process.env.ELECTRON_NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach'})
  }

  win.webContents.on('new-window', function(event, url) {
    if (url || url.includes('http')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

