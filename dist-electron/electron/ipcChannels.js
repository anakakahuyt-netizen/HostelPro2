export const GET_BOARDERS = 'electron:get-boarders';
export const SAVE_BOARDERS = 'electron:save-boarders';
export const GET_ROOMS = 'electron:get-rooms';
export const SAVE_ROOMS = 'electron:save-rooms';
export const GET_PAYMENTS = 'electron:get-payments';
export const SAVE_PAYMENTS = 'electron:save-payments';
export const BOARDER_CHANNELS = {
    GET: GET_BOARDERS,
    SAVE: SAVE_BOARDERS,
};
export const ROOM_CHANNELS = {
    GET: GET_ROOMS,
    SAVE: SAVE_ROOMS,
};
export const PAYMENT_CHANNELS = {
    GET: GET_PAYMENTS,
    SAVE: SAVE_PAYMENTS,
};
export const MIGRATE_LOCAL_STORAGE = 'electron:migrate-local-storage';
// Future IPC handlers will use these channel names in the Electron main process.
// Example:
// ipcMain.handle(ipcChannels.GET_BOARDERS, () => database.getBoarders())
//# sourceMappingURL=ipcChannels.js.map