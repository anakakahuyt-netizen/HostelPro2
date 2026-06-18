import type { Payment } from '../../../types'
import * as databaseAdapter from '../databaseAdapter'

// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class PaymentRepository {
  getAll(): Payment[] {
    return databaseAdapter.getPayments()
  }

  getById(id: string): Payment | undefined {
    return this.getAll().find((payment) => payment.id === id)
  }

  create(payment: Payment): void {
    const payments = [payment, ...this.getAll()]
    this.saveAll(payments)
  }

  update(id: string, patch: Partial<Payment>): void {
    const payments = this.getAll().map((payment) => (payment.id === id ? { ...payment, ...patch } : payment))
    this.saveAll(payments)
  }

  remove(id: string): void {
    const payments = this.getAll().filter((payment) => payment.id !== id)
    this.saveAll(payments)
  }

  saveAll(payments: Payment[]): void {
    databaseAdapter.savePayments(payments)
  }
}
