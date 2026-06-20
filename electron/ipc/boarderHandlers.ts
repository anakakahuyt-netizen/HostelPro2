import { ipcMain } from 'electron'
import { BoarderRepository } from '../../src/services/database/sqlite/boarderRepository.js'
import { GET_BOARDERS, SAVE_BOARDERS } from '../ipcChannels.js'

const boarderRepository = new BoarderRepository()

export function registerBoarderHandlers() {
  ipcMain.on(GET_BOARDERS, (event) => {
    const all = boarderRepository.getAll()
    console.log('[ipc] GET_BOARDERS ->', all.length, all.slice(0, 3))
    event.returnValue = all
  })
  ipcMain.on(SAVE_BOARDERS, (event, boarders) => {
    console.log('[ipc] SAVE_BOARDERS ->', Array.isArray(boarders) ? boarders.length : 'unknown', Array.isArray(boarders) ? boarders.slice(0, 3) : boarders)
    boarderRepository.saveAll(boarders)
    event.returnValue = true
  })
}
