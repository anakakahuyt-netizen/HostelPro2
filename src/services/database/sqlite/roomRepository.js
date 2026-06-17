import * as databaseAdapter from '../databaseAdapter';
// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class RoomRepository {
    getAll() {
        return databaseAdapter.getRooms();
    }
    getById(id) {
        return this.getAll().find((room) => room.id === id);
    }
    create(room) {
        const rooms = [room, ...this.getAll()];
        this.saveAll(rooms);
    }
    update(id, patch) {
        const rooms = this.getAll().map((room) => (room.id === id ? { ...room, ...patch } : room));
        this.saveAll(rooms);
    }
    remove(id) {
        const rooms = this.getAll().filter((room) => room.id !== id);
        this.saveAll(rooms);
    }
    saveAll(rooms) {
        databaseAdapter.saveRooms(rooms);
    }
}
//# sourceMappingURL=roomRepository.js.map