import { app, BrowserWindow, ipcMain } from 'electron'
import { existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { registerBoarderHandlers } from './ipc/boarderHandlers.js'
import { registerRoomHandlers } from './ipc/roomHandlers.js'
import { registerPaymentHandlers } from './ipc/paymentHandlers.js'
import { getLoadTarget, getPreloadPath } from './config/windowConfig.js'
import { getUserDataPath } from './config/appConfig.js'
import { handleSecondInstance, setMainWindow, setupGracefulShutdown } from './services/lifecycleService.js'
import { initializeDatabase, migrateLocalStorage } from './services/databaseService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | null = null

function createWindow() {
  const loadTarget = getLoadTarget()
  const preloadPath = getPreloadPath(__dirname)

  console.log('Creating main window with load target:', loadTarget)
  console.log('preload path:', preloadPath)
  console.log('__dirname:', __dirname)
  console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  setMainWindow(mainWindow)
  console.log('mainWindow created, id:', mainWindow.id)
  try {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.maximize()
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } catch (err) {
    console.error('error while forcing window visibility:', err)
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer console:', { level, message, line, sourceId })
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Main window failed to load', { errorCode, errorDescription, validatedURL })
  })

  if ('url' in loadTarget) {
    console.log('Loading URL:', loadTarget.url)
    try {
      mainWindow.loadURL(loadTarget.url)
    } catch (err) {
      console.error('loadURL threw', err)
    }
  } else {
    console.log('Resolved production index.html path:', loadTarget.file)
    console.log('Production index.html exists:', existsSync(loadTarget.file))
    console.log('Loading file:', loadTarget.file)
    try {
      mainWindow.loadFile(loadTarget.file)
    } catch (err) {
      console.error('loadFile threw', err)
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const userDataPath = getUserDataPath()
// TODO: store the SQLite database file under userDataPath, e.g. `${userDataPath}/hostel-pro.sqlite3`

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

console.log('About to call app.whenReady()')
app.whenReady().then(() => {
  console.log('app.whenReady fired')

  console.log('before initializeDatabase()')
  initializeDatabase()
  console.log('after initializeDatabase()')

  ipcMain.on('electron:migrate-local-storage', (event, boarders, rooms, payments) => {
    try {
      const migrated = migrateLocalStorage(boarders, rooms, payments)
      event.returnValue = migrated
    } catch (error) {
      console.error('migrate-local-storage failed:', error)
      event.returnValue = false
    }
  })

  ipcMain.on('renderer-error', (event, data) => {
    console.error('Renderer error:', data)
  })

  ipcMain.on('renderer-unhandledrejection', (event, data) => {
    console.error('Renderer unhandledRejection:', data)
  })

  registerBoarderHandlers()
  registerRoomHandlers()
  registerPaymentHandlers()
  console.log('IPC handlers registered')

  console.log('before createWindow()')
  createWindow()
  console.log('after createWindow()')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

setupGracefulShutdown()

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// TODO: when moving to SQLite, register new ipcMain handlers here
// and replace databaseAdapter with the SQLite-backed implementation.
