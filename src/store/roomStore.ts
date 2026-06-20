import { create } from 'zustand'
import type { Room } from '../types'
import * as databaseAdapter from '../services/database/databaseAdapter'
import * as storageService from '../services/storageService'
import { showToast } from '../services/toast'
import { logActivity } from '../services/activityLog'

// This store now uses databaseAdapter, which currently forwards to the API layer.
// Future migration will replace the adapter implementation with SQLite/Electron.
interface RoomState {
  rooms: Room[]
  addRoom: (r: Room) => void
  updateRoom: (id: string, patch: Partial<Room>) => void
  removeRoom: (id: string) => void
}

export const useRoomStore = create<RoomState>((set, get) => {
  // Migration: check localStorage first, then SQLite
  let rooms = databaseAdapter.getRooms()
  if (rooms.length === 0) {
    // If SQLite is empty, try to load from localStorage (migration path)
    const storageRooms = storageService.getRooms()
    if (storageRooms && storageRooms.length > 0) {
      console.log('[roomStore] migrating', storageRooms.length, 'rooms from localStorage to SQLite')
      databaseAdapter.saveRooms(storageRooms)
      rooms = storageRooms
    }
  }
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
      logActivity({
        type: 'RoomCreated',
        message: `Room created: ${r.roomNumber}`,
        roomId: r.id,
      })
    },
    updateRoom: (id, patch) => {
      set((s) => {
        const next = s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r))
        databaseAdapter.saveRooms(next)
        return { rooms: next }
      })
      showToast('Room updated')
      logActivity({
        type: 'RoomUpdated',
        message: `Room updated: ${id}`,
        roomId: id,
      })
    },
    removeRoom: (id) => {
      set((s) => {
        const next = s.rooms.filter((r) => r.id !== id && r.roomNumber !== id)
        databaseAdapter.saveRooms(next)
        showToast('Delete completed')
        return { rooms: next }
      })
    },
  }
})
 
