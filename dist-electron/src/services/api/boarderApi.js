import * as storage from '../storageService.js';
export function getAll() {
    return storage.getBoarders();
}
export function saveAll(boarders) {
    storage.saveBoarders(boarders);
}
export function add(boarder) {
    const list = storage.getBoarders();
    storage.saveBoarders([boarder, ...list]);
}
export function update(id, patch) {
    const list = storage.getBoarders().map((b) => (b.id === id ? { ...b, ...patch } : b));
    storage.saveBoarders(list);
}
export function remove(id) {
    const list = storage.getBoarders().filter((b) => b.id !== id);
    storage.saveBoarders(list);
}
export default { getAll, saveAll, add, update, remove };
//# sourceMappingURL=boarderApi.js.map