import { GET_BOARDERS, SAVE_BOARDERS, GET_ROOMS, SAVE_ROOMS, GET_PAYMENTS, SAVE_PAYMENTS, } from '../../../electron/ipcChannels.js';
function getElectronApi() {
    const anyGlobal = globalThis;
    const electronApi = anyGlobal.electron;
    if (!electronApi || typeof electronApi.sendSync !== 'function') {
        return null;
    }
    return electronApi;
}
function invokeSync(channel, ...args) {
    const electronApi = getElectronApi();
    if (!electronApi) {
        console.warn('[sqliteAdapter] Electron API unavailable for', channel);
        return [];
    }
    const result = electronApi.sendSync(channel, ...args);
    return (result ?? []);
}
export function getBoarders() {
    return invokeSync(GET_BOARDERS) || [];
}
export function saveBoarders(boarders) {
    invokeSync(SAVE_BOARDERS, boarders);
}
export function getRooms() {
    return invokeSync(GET_ROOMS) || [];
}
export function saveRooms(rooms) {
    invokeSync(SAVE_ROOMS, rooms);
}
export function getPayments() {
    return invokeSync(GET_PAYMENTS) || [];
}
export function savePayments(payments) {
    invokeSync(SAVE_PAYMENTS, payments);
}
export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments };
//# sourceMappingURL=sqliteAdapter.js.map