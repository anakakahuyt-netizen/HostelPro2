import type { Boarder } from '../../types'
import * as storage from '../storageService'

export function getAll(): Boarder[] {
  return storage.getBoarders()
}

export function saveAll(boarders: Boarder[]) {
  storage.saveBoarders(boarders)
}

export function add(boarder: Boarder) {
  const list = storage.getBoarders()
  storage.saveBoarders([boarder, ...list])
}

export function update(id: string, patch: Partial<Boarder>) {
  const list = storage.getBoarders().map((b) => (b.id === id ? { ...b, ...patch } : b))
  storage.saveBoarders(list)
}

export function remove(id: string) {
  const list = storage.getBoarders().filter((b) => b.id !== id)
  storage.saveBoarders(list)
}

export default { getAll, saveAll, add, update, remove }
