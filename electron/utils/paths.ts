import path from 'path'

export function getPreloadPath(baseDir: string): string {
  return path.join(baseDir, 'preload.js')
}

export function getIndexHtmlPath(baseDir: string): string {
  return path.join(baseDir, '../dist/index.html')
}

// Later, when SQLite is enabled, the database file can be stored under
// app.getPath('userData') in a file like `hostel-pro.sqlite3`.
