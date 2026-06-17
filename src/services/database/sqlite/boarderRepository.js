import * as databaseAdapter from '../databaseAdapter';
// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class BoarderRepository {
    getAll() {
        return databaseAdapter.getBoarders();
    }
    getById(id) {
        return this.getAll().find((boarder) => boarder.id === id);
    }
    create(boarder) {
        const boarders = [boarder, ...this.getAll()];
        this.saveAll(boarders);
    }
    update(id, patch) {
        const boarders = this.getAll().map((boarder) => boarder.id === id ? { ...boarder, ...patch } : boarder);
        this.saveAll(boarders);
    }
    remove(id) {
        const boarders = this.getAll().filter((boarder) => boarder.id !== id);
        this.saveAll(boarders);
    }
    saveAll(boarders) {
        databaseAdapter.saveBoarders(boarders);
    }
}
//# sourceMappingURL=boarderRepository.js.map