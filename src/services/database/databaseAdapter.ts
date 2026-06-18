import * as sqliteAdapter from './sqliteAdapter.js'
import type { Boarder, Room, Payment } from '../../types'

// databaseAdapter is the public database interface for the app.
// Later this file can switch between sqliteAdapter and other adapters.

export function getBoarders(): Boarder[] {
  const result = sqliteAdapter.getBoarders()
  try {
    console.debug('[databaseAdapter] getBoarders ->', result.length, result.slice(0, 3))
  } catch (err) {
    // ignore logging errors
  }
  return result
}

export function saveBoarders(boarders: Boarder[]) {
  try {
    console.debug('[databaseAdapter] saveBoarders ->', boarders.length, boarders.slice(0, 3))
  } catch (err) {
    // ignore logging errors
  }
  sqliteAdapter.saveBoarders(boarders)
}

export function getRooms(): Room[] {
  return sqliteAdapter.getRooms()
}

export function saveRooms(rooms: Room[]) {
  sqliteAdapter.saveRooms(rooms)
}

export function getPayments(): Payment[] {
  return sqliteAdapter.getPayments()
}

export function savePayments(payments: Payment[]) {
  sqliteAdapter.savePayments(payments)
}

export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments }
