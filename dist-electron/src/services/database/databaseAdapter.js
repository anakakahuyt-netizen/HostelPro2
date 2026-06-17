import * as sqliteAdapter from './sqliteAdapter.js';
// databaseAdapter is the public database interface for the app.
// Later this file can switch between sqliteAdapter and other adapters.
export function getBoarders() {
    return sqliteAdapter.getBoarders();
}
export function saveBoarders(boarders) {
    sqliteAdapter.saveBoarders(boarders);
}
export function getRooms() {
    return sqliteAdapter.getRooms();
}
export function saveRooms(rooms) {
    sqliteAdapter.saveRooms(rooms);
}
export function getPayments() {
    return sqliteAdapter.getPayments();
}
export function savePayments(payments) {
    sqliteAdapter.savePayments(payments);
}
export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments };
//# sourceMappingURL=databaseAdapter.js.map