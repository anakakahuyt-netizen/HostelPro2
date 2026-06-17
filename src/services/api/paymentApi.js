import * as storage from '../storageService';
export function getAll() {
    return storage.getPayments();
}
export function saveAll(payments) {
    storage.savePayments(payments);
}
export function add(payment) {
    const list = storage.getPayments();
    storage.savePayments([payment, ...list]);
}
export function update(id, patch) {
    const list = storage.getPayments().map((p) => (p.id === id ? { ...p, ...patch } : p));
    storage.savePayments(list);
}
export function remove(id) {
    const list = storage.getPayments().filter((p) => p.id !== id);
    storage.savePayments(list);
}
export default { getAll, saveAll, add, update, remove };
//# sourceMappingURL=paymentApi.js.map