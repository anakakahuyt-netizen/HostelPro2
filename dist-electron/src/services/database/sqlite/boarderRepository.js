import { getDatabase } from '../../../../electron/services/databaseService.js';
export class BoarderRepository {
    getAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM boarders').all();
    }
    getById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM boarders WHERE id = ?').get(id);
    }
    create(boarder) {
        const db = getDatabase();
        const stmt = db.prepare(`INSERT OR REPLACE INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
       VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`);
        stmt.run(boarder);
    }
    update(id, patch) {
        const existing = this.getById(id);
        if (!existing)
            return;
        const updated = { ...existing, ...patch };
        this.create(updated);
    }
    remove(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM boarders WHERE id = ?').run(id);
    }
    saveAll(boarders) {
        const db = getDatabase();
        const insert = db.prepare(`INSERT OR REPLACE INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
       VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`);
        const transaction = db.transaction((items) => {
            db.prepare('DELETE FROM boarders').run();
            for (const boarder of items) {
                insert.run(boarder);
            }
        });
        transaction(boarders);
    }
}
//# sourceMappingURL=boarderRepository.js.map