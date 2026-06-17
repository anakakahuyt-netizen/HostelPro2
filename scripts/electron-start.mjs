#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)
const cmdExe = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : '/bin/sh'
const electronExecutable = process.platform === 'win32'
  ? join(rootDir, 'node_modules', '.bin', 'electron.cmd')
  : join(rootDir, 'node_modules', '.bin', 'electron')

const electronAppPath = fileURLToPath(new URL('../dist-electron/electron/main.js', import.meta.url))

// Start packaged Electron app
const electron = spawn(cmdExe, process.platform === 'win32'
  ? ['/c', electronExecutable, electronAppPath]
  : ['-c', `${electronExecutable} ${electronAppPath}`], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
})

process.on('SIGINT', () => {
  electron.kill()
  process.exit()
})
