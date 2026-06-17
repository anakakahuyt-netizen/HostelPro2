import { getDatabase } from '../../../../electron/services/databaseService.js';
export class PaymentRepository {
    getAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM payments').all();
    }
    getById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    }
    create(payment) {
        const db = getDatabase();
        const stmt = db.prepare(`INSERT OR REPLACE INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
       VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`);
        stmt.run(payment);
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
        db.prepare('DELETE FROM payments WHERE id = ?').run(id);
    }
    saveAll(payments) {
        const db = getDatabase();
        const insert = db.prepare(`INSERT OR REPLACE INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
       VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`);
        const transaction = db.transaction((items) => {
            db.prepare('DELETE FROM payments').run();
            for (const payment of items) {
                insert.run(payment);
            }
        });
        transaction(payments);
    }
}
//# sourceMappingURL=paymentRepository.js.map