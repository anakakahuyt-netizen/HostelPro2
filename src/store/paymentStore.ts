import { create } from 'zustand'
import type { Payment } from '../types'
import * as databaseAdapter from '../services/database/databaseAdapter'
import { showToast } from '../services/toast'

// This store uses databaseAdapter, allowing the persistence layer to be swapped later.
interface PaymentState {
  payments: Payment[]
  addPayment: (p: Payment) => void
  updatePayment: (id: string, patch: Partial<Payment>) => void
  removePayment: (id: string) => void
  getPaymentsByBoarder: (boarderId: string) => Payment[]
}

export const usePaymentStore = create<PaymentState>((set, get) => {
  const payments = databaseAdapter.getPayments()
  return {
    payments,
    addPayment: (p) => {
      if (p.amount < 0) {
        showToast('Payment amount cannot be negative')
        return
      }
      set((s) => {
        const next = [p, ...s.payments]
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
        const next = s.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment))
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
 
