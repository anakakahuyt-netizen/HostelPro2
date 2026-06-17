#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'net'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)
const cmdExe = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : '/bin/sh'
const electronExecutable = process.platform === 'win32'
  ? join(rootDir, 'node_modules', '.bin', 'electron.cmd')
  : join(rootDir, 'node_modules', '.bin', 'electron')

const electronCommand = fs.existsSync(electronExecutable) ? electronExecutable : 'electron'

function findFreePort(startPort = 5173) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        resolve(findFreePort(startPort + 1))
      } else {
        reject(err)
      }
    })
    server.listen(startPort, () => {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : startPort
      server.close(() => resolve(port))
    })
  })
}

async function main() {
  // Set development environment
  process.env.NODE_ENV = 'development'

  const port = await findFreePort(5173)
  console.log('Starting Vite dev server on port', port)

  let electronProcess = null
  let viteUrl = ''
  let buffer = ''

  const vite = spawn(cmdExe, process.platform === 'win32'
    ? ['/c', `npm run dev -- --port ${port}`]
    : ['-c', `npm run dev -- --port ${port}`], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
  })

  function handleViteOutput(chunk) {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      console.log('vite:', trimmed)
      // try to find a URL in the output (looser match to handle ANSI/Unicode)
      const urlMatch = trimmed.match(/https?:\/\/[^\s)]+/i)
      if (urlMatch && !viteUrl) {
        viteUrl = urlMatch[0]
        console.log('Detected Vite URL (loose):', viteUrl)
        startElectron(viteUrl)
        continue
      }

      // fallback: if Vite reports it's ready, assume localhost and start Electron
      if (/ready/i.test(trimmed) && !viteUrl) {
        viteUrl = `http://localhost:${port}`
        console.log('Vite ready detected, using fallback URL:', viteUrl)
        startElectron(viteUrl)
      }
    }
  }

  vite.stdout.on('data', handleViteOutput)
  vite.stderr.on('data', handleViteOutput)

  vite.on('exit', (code) => {
    if (electronProcess) {
      electronProcess.kill()
    }
    process.exit(code ?? 0)
  })

  vite.on('error', (error) => {
    console.error('Vite failed to start:', error)
    process.exit(1)
  })

  function startElectron(url) {
    if (electronProcess) return
    console.log('Starting Electron using', url)
    const electronAppPath = fileURLToPath(new URL('../dist-electron/electron/main.js', import.meta.url))
    console.log('electronExecutable:', electronExecutable)
    console.log('electronCommand:', electronCommand)
    console.log('electronAppPath:', electronAppPath)
    if (process.platform === 'win32') {
      electronProcess = spawn(cmdExe, ['/c', electronExecutable, electronAppPath], {
        cwd: rootDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: url },
      })
    } else {
      electronProcess = spawn(electronCommand, [electronAppPath], {
        cwd: rootDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: url },
      })
    }

    electronProcess.on('error', (error) => {
      console.error('Electron failed to start:', error)
    })

    electronProcess.on('exit', () => {
      vite.kill()
      process.exit()
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})