import { app, BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null
const singleInstanceLock = app.requestSingleInstanceLock()

export function isSingleInstance(): boolean {
  return Boolean(singleInstanceLock)
}

export function handleSecondInstance() {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
}

export function setMainWindow(window: BrowserWindow) {
  mainWindow = window
}

export function closeMainWindow() {
  if (mainWindow) {
    mainWindow.close()
  }
}

export function setupGracefulShutdown() {
  app.on('before-quit', () => {
    // TODO: close the SQLite database connection and clean up resources before quitting.
  })
}

// TODO: add auto-updater hooks and event handling in this service later.
