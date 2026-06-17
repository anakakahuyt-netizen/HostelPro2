import type { Room } from '../../types'
import * as storage from '../storageService.js'

export function getAll(): Room[] {
  return storage.getRooms()
}

export function saveAll(rooms: Room[]) {
  storage.saveRooms(rooms)
}

export function add(room: Room) {
  const list = storage.getRooms()
  storage.saveRooms([room, ...list])
}

export function update(id: string, patch: Partial<Room>) {
  const list = storage.getRooms().map((r) => (r.id === id ? { ...r, ...patch } : r))
  storage.saveRooms(list)
}

export function remove(id: string) {
  const list = storage.getRooms().filter((r) => r.id !== id)
  storage.saveRooms(list)
}

export default { getAll, saveAll, add, update, remove }
