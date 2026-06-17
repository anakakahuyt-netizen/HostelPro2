import * as storage from '../storageService';
export function getAll() {
    return storage.getRooms();
}
export function saveAll(rooms) {
    storage.saveRooms(rooms);
}
export function add(room) {
    const list = storage.getRooms();
    storage.saveRooms([room, ...list]);
}
export function update(id, patch) {
    const list = storage.getRooms().map((r) => (r.id === id ? { ...r, ...patch } : r));
    storage.saveRooms(list);
}
export function remove(id) {
    const list = storage.getRooms().filter((r) => r.id !== id);
    storage.saveRooms(list);
}
export default { getAll, saveAll, add, update, remove };
//# sourceMappingURL=roomApi.js.map