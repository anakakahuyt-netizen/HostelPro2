import { create } from 'zustand'
import type { Boarder, Payment, Room, PaymentStatus } from '../types'
import { useBoarderStore } from './boarderStore'
import { useRoomStore } from './roomStore'
import * as databaseAdapter from '../services/database/databaseAdapter'
import * as storageService from '../services/storageService'
import { showToast } from '../services/toast'

function getRoomPrice(payment: Payment, rooms: Room[], boarders: Boarder[]) {
  const room = rooms.find((r) => r.id === payment.room || r.roomNumber === payment.room)
  if (room?.price != null) return room.price
  const boarder = boarders.find((b) => b.id === payment.boarderId)
  const boarderRoom = rooms.find((r) => r.id === boarder?.room || r.roomNumber === boarder?.room)
  return boarderRoom?.price || 0
}

export function computePaymentStatus(payment: Payment, rooms: Room[], boarders: Boarder[]): PaymentStatus {
  const amount = Number(payment.amount || 0)
  const rent = getRoomPrice(payment, rooms, boarders)
  if (amount === 0) return 'Due'
  if (amount > rent) return 'Advance'
  if (amount === rent) return 'Paid'
  if (amount > 0) return 'Partial'
  return 'Due'
}

function normalizePayment(payment: Payment, rooms: Room[], boarders: Boarder[]): Payment {
  return { ...payment, status: computePaymentStatus(payment, rooms, boarders) }
}

function normalizePayments(payments: Payment[], rooms: Room[], boarders: Boarder[]): Payment[] {
  return payments.map((payment) => normalizePayment(payment, rooms, boarders))
}

// This store uses databaseAdapter, allowing the persistence layer to be swapped later.
interface PaymentState {
  payments: Payment[]
  addPayment: (p: Payment) => void
  updatePayment: (id: string, patch: Partial<Payment>) => void
  removePayment: (id: string) => void
  getPaymentsByBoarder: (boarderId: string) => Payment[]
}

export const usePaymentStore = create<PaymentState>((set, get) => {
  const boarders = useBoarderStore.getState().boarders
  const rooms = useRoomStore.getState().rooms
  // Migration: check localStorage first, then SQLite
  let payments = normalizePayments(databaseAdapter.getPayments(), rooms, boarders)
  if (payments.length === 0) {
    // If SQLite is empty, try to load from localStorage (migration path)
    const storagePayments = storageService.getPayments()
    if (storagePayments && storagePayments.length > 0) {
      console.log('[paymentStore] migrating', storagePayments.length, 'payments from localStorage to SQLite')
      const normalizedPayments = normalizePayments(storagePayments, rooms, boarders)
      databaseAdapter.savePayments(normalizedPayments)
      payments = normalizedPayments
    }
  }
  return {
    payments,
    addPayment: (p) => {
      if (p.amount < 0) {
        showToast('Payment amount cannot be negative')
        return
      }
      set((s) => {
        const payment = normalizePayment(p, rooms, boarders)
        const next = [payment, ...s.payments]
        databaseAdapter.savePayments(next)
        return { payments: next }
      })
    },
    updatePayment: (id, patch) => {
      if (patch.amount !== undefined && patch.amount < 0) {
        showToast('Payment amount cannot be negative')
        return
      }
      set((s) => {
        const next = s.payments.map((payment) => {
          if (payment.id !== id) return payment
          const updated = { ...payment, ...patch }
          return normalizePayment(updated, rooms, boarders)
        })
        databaseAdapter.savePayments(next)
        return { payments: next }
      })
    },
    removePayment: (id) => set((s) => {
      const next = s.payments.filter((x) => x.id !== id)
      databaseAdapter.savePayments(next)
      return { payments: next }
    }),
    getPaymentsByBoarder: (boarderId) => get().payments.filter((p) => p.boarderId === boarderId),
  }
})
 
