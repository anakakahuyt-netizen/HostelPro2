import { create } from 'zustand'
import type { Room } from '../types'
import * as databaseAdapter from '../services/database/databaseAdapter'
import { showToast } from '../services/toast'

// This store now uses databaseAdapter, which currently forwards to the API layer.
// Future migration will replace the adapter implementation with SQLite/Electron.
interface RoomState {
  rooms: Room[]
  addRoom: (r: Room) => void
  updateRoom: (id: string, patch: Partial<Room>) => void
  removeRoom: (id: string) => void
}

export const useRoomStore = create<RoomState>((set, get) => {
  const rooms = databaseAdapter.getRooms()
  return {
    rooms,
    addRoom: (r) => {
      const exists = get().rooms.find((x) => x.roomNumber === r.roomNumber)
      if (exists) {
        showToast('Room number already exists')
        return
      }
      set((s) => {
        const next = [r, ...s.rooms]
        databaseAdapter.saveRooms(next)
        return { rooms: next }
      })
    },
    updateRoom: (id, patch) => {
      set((s) => {
        const next = s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r))
        databaseAdapter.saveRooms(next)
        return { rooms: next }
      })
    },
    removeRoom: (id) => {
      set((s) => {
        const next = s.rooms.filter((r) => r.id !== id)
        databaseAdapter.saveRooms(next)
        return { rooms: next }
      })
    },
  }
})
 
