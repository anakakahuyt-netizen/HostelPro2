import type { Boarder, Room, Payment } from '../../types'
import {
  GET_BOARDERS,
  SAVE_BOARDERS,
  GET_ROOMS,
  SAVE_ROOMS,
  GET_PAYMENTS,
  SAVE_PAYMENTS,
} from '../../../electron/ipcChannels.js'

function getElectronApi(): { sendSync: (channel: string, ...args: unknown[]) => unknown } | null {
  const anyGlobal = globalThis as unknown as { electron?: unknown }
  const electronApi = anyGlobal.electron as any
  if (!electronApi || typeof electronApi.sendSync !== 'function') {
    return null
  }
  return electronApi
}

function invokeSync<T>(channel: string, ...args: unknown[]): T {
  const electronApi = getElectronApi()
  if (!electronApi) {
    console.warn('[sqliteAdapter] Electron API unavailable for', channel)
    return [] as unknown as T
  }

  const result = electronApi.sendSync(channel, ...args)
  return (result ?? ([] as unknown)) as T
}

export function getBoarders(): Boarder[] {
  const result = invokeSync<Boarder[]>(GET_BOARDERS) || []
  try {
    // Temporary debug: trace IPC return values
    console.debug('[sqliteAdapter] getBoarders ->', result.length, result.slice(0, 3))
  } catch (err) {
    // ignore logging errors
  }
  return result
}

export function saveBoarders(boarders: Boarder[]) {
  try {
    console.debug('[sqliteAdapter] saveBoarders ->', boarders.length, boarders.slice(0, 3))
  } catch (err) {
    // ignore logging errors
  }
  invokeSync<boolean>(SAVE_BOARDERS, boarders)
}

export function getRooms(): Room[] {
  return invokeSync<Room[]>(GET_ROOMS) || []
}

export function saveRooms(rooms: Room[]) {
  invokeSync<boolean>(SAVE_ROOMS, rooms)
}

export function getPayments(): Payment[] {
  return invokeSync<Payment[]>(GET_PAYMENTS) || []
}

export function savePayments(payments: Payment[]) {
  invokeSync<boolean>(SAVE_PAYMENTS, payments)
}

export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments }
