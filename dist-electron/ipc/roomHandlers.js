import { ipcMain } from 'electron';
import { RoomRepository } from '../../src/services/database/sqlite/roomRepository';
import { GET_ROOMS, SAVE_ROOMS } from '../ipcChannels';
const roomRepository = new RoomRepository();
// Room IPC handlers currently delegate to the repository layer.
// Future SQLite handlers will use prepared statements and a real database connection.
export function registerRoomHandlers() {
    ipcMain.handle(GET_ROOMS, () => {
        return roomRepository.getAll();
    });
    ipcMain.handle(SAVE_ROOMS, (_event, rooms) => {
        roomRepository.saveAll(rooms);
        return true;
    });
}
//# sourceMappingURL=roomHandlers.js.map