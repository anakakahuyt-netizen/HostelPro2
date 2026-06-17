import { ipcMain } from 'electron'
import { RoomRepository } from '../../src/services/database/sqlite/roomRepository.js'
import { GET_ROOMS, SAVE_ROOMS } from '../ipcChannels.js'

const roomRepository = new RoomRepository()

export function registerRoomHandlers() {
  ipcMain.on(GET_ROOMS, (event) => {
    event.returnValue = roomRepository.getAll()
  })
  ipcMain.on(SAVE_ROOMS, (event, rooms) => {
    roomRepository.saveAll(rooms)
    event.returnValue = true
  })
}
