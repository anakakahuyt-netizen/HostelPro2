import type { Boarder } from '../../../types'
import { getDatabase } from '../../../../electron/services/databaseService.js'

export class BoarderRepository {
  getAll(): Boarder[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM boarders').all() as Boarder[]
  }

  getById(id: string): Boarder | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM boarders WHERE id = ?').get(id) as Boarder | undefined
  }

  create(boarder: Boarder): void {
    const db = getDatabase()
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
       VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`,
    )
    stmt.run(boarder)
  }

  update(id: string, patch: Partial<Boarder>): void {
    const existing = this.getById(id)
    if (!existing) return
    const updated = { ...existing, ...patch }
    this.create(updated)
  }

  remove(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM boarders WHERE id = ?').run(id)
  }

  saveAll(boarders: Boarder[]): void {
    const db = getDatabase()
    const insert = db.prepare(
      `INSERT OR REPLACE INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
       VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`,
    )
    const transaction = db.transaction((items: Boarder[]) => {
      db.prepare('DELETE FROM boarders').run()
      for (const boarder of items) {
        insert.run(boarder)
      }
    })
    transaction(boarders)
  }
}
