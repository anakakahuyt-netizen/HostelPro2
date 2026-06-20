import { create } from 'zustand'
import type { Boarder } from '../types'
import { useRoomStore } from './roomStore'
import * as databaseAdapter from '../services/database/databaseAdapter'
import * as storageService from '../services/storageService'
import { showToast } from '../services/toast'
import { normalizeBoarderStatus } from '../utils/boarderLedger'
import { logActivity } from '../services/activityLog'

// This store uses databaseAdapter today, which delegates to the current API layer.
// Later the databaseAdapter can be switched to use Electron IPC and SQLite.
interface BoarderState {
  boarders: Boarder[]
  addBoarder: (b: Boarder) => void
  updateBoarder: (id: string, patch: Partial<Boarder>) => void
  removeBoarder: (id: string) => void
  restoreBoarder: (id: string) => void
}

export const useBoarderStore = create<BoarderState>((set, get) => {
  // Migration: check localStorage first, then SQLite
  let boarders = databaseAdapter.getBoarders()
  if (boarders.length === 0) {
    // If SQLite is empty, try to load from localStorage (migration path)
    const storageBoarders = storageService.getBoarders()
    if (storageBoarders && storageBoarders.length > 0) {
      console.log('[boarderStore] migrating', storageBoarders.length, 'boarders from localStorage to SQLite')
      databaseAdapter.saveBoarders(storageBoarders)
      boarders = storageBoarders
    }
  }
  try {
    const statusCounts = boarders.reduce<Record<string, number>>((acc, boarder) => {
      const status = boarder.status || 'UNKNOWN'
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    }, {})
    console.debug('[boarderStore] init boarders ->', boarders.length, boarders.slice(0, 3), statusCounts)
  } catch (err) {
    console.error('[boarderStore] init boarders debug failed', err)
  }
  return {
    boarders,
    addBoarder: (b) => {
      const roomsApi = useRoomStore.getState()
      const room = roomsApi.rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
      const active = normalizeBoarderStatus(b.status) === 'ACTIVE'
      if (room && room.occupied >= room.capacity && active) {
        showToast('Cannot assign boarder to a full room')
        return
      }
      const boarder: Boarder = {
        ...b,
        roomHistory: b.roomHistory || (room ? [{ roomNumber: room.roomNumber, price: room.price }] : []),
        archived: normalizeBoarderStatus(b.status) === 'CLOSED',
      }
      set((s) => {
        const next = [boarder, ...s.boarders]
        databaseAdapter.saveBoarders(next)
        return { boarders: next }
      })
      showToast('Boarder added')
      logActivity({
        type: 'BoarderAdded',
        message: `Boarder added: ${boarder.name}`,
        boarderId: boarder.id,
      })
      if (normalizeBoarderStatus(boarder.status) === 'BOOKED') {
        logActivity({
          type: 'BookingCreated',
          message: `Booking created for ${boarder.name}`,
          boarderId: boarder.id,
        })
      }
      if (room && active) roomsApi.updateRoom(room.id, { occupied: Math.min(room.capacity, room.occupied + 1) })
    },
    updateBoarder: (id, patch) => {
      const prev = get().boarders.find((b) => b.id === id)
      const newRoomId = (patch.room as string) || prev?.room
      const roomsApi = useRoomStore.getState()
      const newRoom = roomsApi.rooms.find((r) => r.id === newRoomId || r.roomNumber === newRoomId)
      const prevActive = prev ? normalizeBoarderStatus(prev.status) === 'ACTIVE' : false
      const newActive = normalizeBoarderStatus((patch.status as string) || prev?.status || '') === 'ACTIVE'
      if (newRoom && newRoom.occupied >= newRoom.capacity && (!prev || prev.room !== newRoomId) && newActive) {
        showToast('Cannot move boarder to a full room')
        return
      }
      const archived = normalizeBoarderStatus((patch.status as string) || prev?.status || '') === 'CLOSED'
      set((s) => {
        const next = s.boarders.map((b) => {
          if (b.id !== id) return b
          const oldRoom = roomsApi.rooms.find((r) => r.id === prev?.room || r.roomNumber === prev?.room)
          const oldRoomNumber = oldRoom?.roomNumber || prev?.room
          const oldRoomPrice = oldRoom?.price || 0
          const existingHistory = prev?.roomHistory || []
          const hasOldEntry = existingHistory.some((entry) => {
            if (typeof entry === 'string') return entry === oldRoomNumber
            return entry.roomNumber === oldRoomNumber
          })
          const roomHistory = oldRoomNumber && !hasOldEntry
            ? [...existingHistory, { roomNumber: oldRoomNumber, price: oldRoomPrice }]
            : existingHistory
          // If we're archiving now and the boarder wasn't previously closed, record previous status in notes.
          let notes = b.notes || ''
          if (archived && normalizeBoarderStatus(b.status) !== 'CLOSED') {
            if (!/__prevStatus=/.test(notes)) {
              notes = `__prevStatus=${normalizeBoarderStatus(b.status)}\n${notes}`
            }
          }
          return { ...b, ...patch, roomHistory, archived, notes }
        })
        databaseAdapter.saveBoarders(next)
        return { boarders: next }
      })
      if (prev) {
        const oldRoom = roomsApi.rooms.find((r) => r.id === prev.room || r.roomNumber === prev.room)
        if (oldRoom) {
          if (prevActive && (!newActive || prev.room !== newRoomId)) {
            roomsApi.updateRoom(oldRoom.id, { occupied: Math.max(0, oldRoom.occupied - 1) })
          }
        }
        if (newRoom) {
          if (newActive && (!prevActive || prev.room !== newRoomId)) {
            roomsApi.updateRoom(newRoom.id, { occupied: Math.min(newRoom.capacity, newRoom.occupied + 1) })
          }
        }
      }
      if (prev) {
        const roomChanged = patch.room && prev.room !== patch.room
        const statusChanged = patch.status && prev.status !== patch.status
        if (roomChanged) {
          logActivity({
            type: 'RoomChanged',
            message: `Room changed for ${prev.name}: ${prev.room} → ${(patch.room as string)}`,
            boarderId: id,
          })
        }
        if (statusChanged && normalizeBoarderStatus((patch.status as string) || '') === 'CHECKED_OUT') {
          logActivity({
            type: 'BoarderCheckedOut',
            message: `Boarder checked out: ${prev.name}`,
            boarderId: id,
          })
        }
        if (statusChanged && normalizeBoarderStatus((patch.status as string) || '') === 'CLOSED') {
          logActivity({
            type: 'BoarderArchived',
            message: `Boarder archived: ${prev.name}`,
            boarderId: id,
          })
        }
        if (statusChanged && normalizeBoarderStatus((patch.status as string) || '') === 'ACTIVE' && normalizeBoarderStatus(prev.status) === 'CLOSED') {
          logActivity({
            type: 'BoarderRestored',
            message: `Boarder restored: ${prev.name}`,
            boarderId: id,
          })
        }
      }
    },
    removeBoarder: (id) => {
      const boarder = get().boarders.find((b) => b.id === id)
      set((s) => {
        const next = s.boarders.filter((b) => b.id !== id)
        databaseAdapter.saveBoarders(next)
        return { boarders: next }
      })
      if (boarder) {
        const active = normalizeBoarderStatus(boarder.status) === 'ACTIVE'
        const roomsApi = useRoomStore.getState()
        const room = roomsApi.rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
        if (room && active) roomsApi.updateRoom(room.id, { occupied: Math.max(0, room.occupied - 1) })
      }
    },
    restoreBoarder: (id) => {
      const boarder = get().boarders.find((b) => b.id === id)
      if (!boarder) return
      // If notes contain a previous status marker, use it. Marker format: __prevStatus=STATUS\n
      const notes = boarder.notes || ''
      const match = notes.match(/__prevStatus=(ACTIVE|BOOKED|CHECKED_OUT|CLOSED)\n?/) 
      const prevStatus = match ? match[1] : undefined
      const newStatus = prevStatus || 'ACTIVE'
      const cleanedNotes = notes.replace(/__prevStatus=(?:ACTIVE|BOOKED|CHECKED_OUT|CLOSED)\n?/, '')

      const roomsApi = useRoomStore.getState()
      const room = roomsApi.rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
      const wasActive = normalizeBoarderStatus(boarder.status) === 'ACTIVE'
      const willBeActive = normalizeBoarderStatus(newStatus) === 'ACTIVE'

      set((s) => {
        const next = s.boarders.map((b) => (b.id === id ? { ...b, status: newStatus as any, archived: false, notes: cleanedNotes } : b))
        databaseAdapter.saveBoarders(next)
        return { boarders: next }
      })

      // adjust room occupancy if needed
      if (room) {
        if (!wasActive && willBeActive) {
          roomsApi.updateRoom(room.id, { occupied: Math.min(room.capacity, room.occupied + 1) })
        }
        if (wasActive && !willBeActive) {
          roomsApi.updateRoom(room.id, { occupied: Math.max(0, room.occupied - 1) })
        }
      }
      if (!wasActive && willBeActive) {
        logActivity({
          type: 'BoarderRestored',
          message: `Boarder restored: ${boarder.name}`,
          boarderId: id,
        })
      }
    },
  }
})
