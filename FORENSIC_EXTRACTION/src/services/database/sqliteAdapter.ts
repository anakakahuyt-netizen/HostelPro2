import * as boarderApi from '../api/boarderApi'
import * as roomApi from '../api/roomApi'
import * as paymentApi from '../api/paymentApi'
import type { Boarder, Room, Payment } from '../../types'

// sqliteAdapter is the place to hook into Electron IPC and a real SQLite driver
// later. For now, it proxies through the existing API layer.

export function getBoarders(): Boarder[] {
  // TODO: replace with IPC call to main process using Electron and better-sqlite3
  return boarderApi.getAll()
}

export function saveBoarders(boarders: Boarder[]) {
  // TODO: update with SQLite persistence via Electron IPC
  boarderApi.saveAll(boarders)
}

export function getRooms(): Room[] {
  // TODO: replace with IPC call to main process using Electron and better-sqlite3
  return roomApi.getAll()
}

export function saveRooms(rooms: Room[]) {
  // TODO: update with SQLite persistence via Electron IPC
  roomApi.saveAll(rooms)
}

export function getPayments(): Payment[] {
  // TODO: replace with IPC call to main process using Electron and better-sqlite3
  return paymentApi.getAll()
}

export function savePayments(payments: Payment[]) {
  // TODO: update with SQLite persistence via Electron IPC
  paymentApi.saveAll(payments)
}

export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments }
