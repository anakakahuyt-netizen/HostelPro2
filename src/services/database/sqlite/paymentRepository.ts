import type { Payment } from '../../../types'
import { getDatabase } from '../../../../electron/services/databaseService.js'

export class PaymentRepository {
  getAll(): Payment[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM payments').all() as Payment[]
  }

  getById(id: string): Payment | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment | undefined
  }

  create(payment: Payment): void {
    const db = getDatabase()
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
       VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`,
    )
    stmt.run(payment)
  }

  update(id: string, patch: Partial<Payment>): void {
    const existing = this.getById(id)
    if (!existing) return
    const updated = { ...existing, ...patch }
    this.create(updated)
  }

  remove(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM payments WHERE id = ?').run(id)
  }

  saveAll(payments: Payment[]): void {
    const db = getDatabase()
    const insert = db.prepare(
      `INSERT OR REPLACE INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
       VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`,
    )
    const transaction = db.transaction((items: Payment[]) => {
      db.prepare('DELETE FROM payments').run()
      for (const payment of items) {
        insert.run(payment)
      }
    })
    transaction(payments)
  }
}
