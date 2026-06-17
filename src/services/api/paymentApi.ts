import type { Payment } from '../../types'
import * as storage from '../storageService'

export function getAll(): Payment[] {
  return storage.getPayments()
}

export function saveAll(payments: Payment[]) {
  storage.savePayments(payments)
}

export function add(payment: Payment) {
  const list = storage.getPayments()
  storage.savePayments([payment, ...list])
}

export function update(id: string, patch: Partial<Payment>) {
  const list = storage.getPayments().map((p) => (p.id === id ? { ...p, ...patch } : p))
  storage.savePayments(list)
}

export function remove(id: string) {
  const list = storage.getPayments().filter((p) => p.id !== id)
  storage.savePayments(list)
}

export default { getAll, saveAll, add, update, remove }
