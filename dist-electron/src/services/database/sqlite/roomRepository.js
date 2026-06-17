import { getDatabase } from '../../../../electron/services/databaseService.js';
export class RoomRepository {
    getAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM rooms').all().map((row) => ({
            ...row,
            amenities: JSON.parse(row.amenities || '[]'),
        }));
    }
    getById(id) {
        const db = getDatabase();
        const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
        if (!row)
            return undefined;
        const anyRow = row;
        return { ...anyRow, amenities: JSON.parse(anyRow.amenities || '[]') };
    }
    create(room) {
        const db = getDatabase();
        const stmt = db.prepare(`INSERT OR REPLACE INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
       VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`);
        stmt.run({ ...room, amenities: JSON.stringify(room.amenities || []) });
    }
    update(id, patch) {
        const existing = this.getById(id);
        if (!existing)
            return;
        const updated = { ...existing, ...patch };
        if (patch.amenities) {
            updated.amenities = patch.amenities;
        }
        this.create(updated);
    }
    remove(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    }
    saveAll(rooms) {
        const db = getDatabase();
        const insert = db.prepare(`INSERT OR REPLACE INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
       VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`);
        const transaction = db.transaction((items) => {
            db.prepare('DELETE FROM rooms').run();
            for (const room of items) {
                insert.run({ ...room, amenities: JSON.stringify(room.amenities || []) });
            }
        });
        transaction(rooms);
    }
}
//# sourceMappingURL=roomRepository.js.map