import * as boarderApi from '../api/boarderApi';
import * as roomApi from '../api/roomApi';
import * as paymentApi from '../api/paymentApi';
// sqliteAdapter is the place to hook into Electron IPC and a real SQLite driver
// later. For now, it proxies through the existing API layer.
export function getBoarders() {
    // TODO: replace with IPC call to main process using Electron and better-sqlite3
    return boarderApi.getAll();
}
export function saveBoarders(boarders) {
    // TODO: update with SQLite persistence via Electron IPC
    boarderApi.saveAll(boarders);
}
export function getRooms() {
    // TODO: replace with IPC call to main process using Electron and better-sqlite3
    return roomApi.getAll();
}
export function saveRooms(rooms) {
    // TODO: update with SQLite persistence via Electron IPC
    roomApi.saveAll(rooms);
}
export function getPayments() {
    // TODO: replace with IPC call to main process using Electron and better-sqlite3
    return paymentApi.getAll();
}
export function savePayments(payments) {
    // TODO: update with SQLite persistence via Electron IPC
    paymentApi.saveAll(payments);
}
export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments };
//# sourceMappingURL=sqliteAdapter.js.map