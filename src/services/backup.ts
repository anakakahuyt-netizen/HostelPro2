import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import * as databaseAdapter from './database/databaseAdapter'

export function exportBackup() {
  const data = {
    boarders: useBoarderStore.getState().boarders,
    rooms: useRoomStore.getState().rooms,
    payments: usePaymentStore.getState().payments,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hostelpro-backup-${new Date().toISOString().slice(0,10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File) {
  const text = await file.text()
  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }

  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid backup format')
  }

  const backup = obj as Record<string, unknown>
  if (!Array.isArray(backup.boarders) || !Array.isArray(backup.rooms) || !Array.isArray(backup.payments)) {
    throw new Error('Invalid backup format')
  }

  const boarders = backup.boarders as any[]
  const rooms = backup.rooms as any[]
  const payments = backup.payments as any[]

  useBoarderStore.setState({ boarders })
  useRoomStore.setState({ rooms })
  usePaymentStore.setState({ payments })

  databaseAdapter.saveBoarders(boarders)
  databaseAdapter.saveRooms(rooms)
  databaseAdapter.savePayments(payments)
}

export default { exportBackup, importBackup }
