import { ipcMain } from 'electron'
import { BoarderRepository } from '../../src/services/database/sqlite/boarderRepository.js'
import { GET_BOARDERS, SAVE_BOARDERS } from '../ipcChannels.js'

const boarderRepository = new BoarderRepository()

export function registerBoarderHandlers() {
  ipcMain.on(GET_BOARDERS, (event) => {
    event.returnValue = boarderRepository.getAll()
  })
  ipcMain.on(SAVE_BOARDERS, (event, boarders) => {
    boarderRepository.saveAll(boarders)
    event.returnValue = true
  })
}
