import type { Room } from '../../../types'
import { getDatabase } from '../../../../electron/services/databaseService.js'

export class RoomRepository {
  getAll(): Room[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM rooms').all().map((row: any) => ({
      ...row,
      amenities: JSON.parse(row.amenities || '[]'),
    })) as Room[]
  }

  getById(id: string): Room | undefined {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)
    if (!row) return undefined
    const anyRow = row as any
    return { ...anyRow, amenities: JSON.parse(anyRow.amenities || '[]') } as Room
  }

  create(room: Room): void {
    const db = getDatabase()
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
       VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`,
    )
    stmt.run({ ...room, amenities: JSON.stringify(room.amenities || []) })
  }

  update(id: string, patch: Partial<Room>): void {
    const existing = this.getById(id)
    if (!existing) return
    const updated = { ...existing, ...patch }
    if (patch.amenities) {
      updated.amenities = patch.amenities
    }
    this.create(updated)
  }

  remove(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id)
  }

  saveAll(rooms: Room[]): void {
    const db = getDatabase()
    const insert = db.prepare(
      `INSERT OR REPLACE INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
       VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`,
    )
    const transaction = db.transaction((items: Room[]) => {
      db.prepare('DELETE FROM rooms').run()
      for (const room of items) {
        insert.run({ ...room, amenities: JSON.stringify(room.amenities || []) })
      }
    })
    transaction(rooms)
  }
}
