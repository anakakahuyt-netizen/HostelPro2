import type { Room } from '../../../types'
import { getDatabase } from '../../../../electron/services/databaseService.js'

const getBuildingName = (roomNumber: string): string => {
  const digits = Number(String(roomNumber).replace(/[^0-9]/g, ''))
  if (!digits) return ''
  if (digits >= 101 && digits <= 305) return 'Jubayer Mess Old'
  if (digits >= 1001 && digits <= 3007) return 'Jubayer Mess New'
  return ''
}

const normalizeRoom = (room: Room): Room => ({
  ...room,
  name: room.name || getBuildingName(room.roomNumber) || '',
  amenities: room.amenities || [],
})

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
    const normalized = normalizeRoom(room)
    stmt.run({ ...normalized, amenities: JSON.stringify(normalized.amenities) })
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
        const normalized = normalizeRoom(room)
        insert.run({ ...normalized, amenities: JSON.stringify(normalized.amenities) })
      }
    })
    transaction(rooms)
  }
}
