import { ipcMain } from 'electron';
import { BoarderRepository } from '../../src/services/database/sqlite/boarderRepository';
import { GET_BOARDERS, SAVE_BOARDERS } from '../ipcChannels';
const boarderRepository = new BoarderRepository();
// Boarder IPC handlers currently delegate to the repository layer.
// Future SQLite handlers will use prepared statements and a real database connection.
export function registerBoarderHandlers() {
    ipcMain.handle(GET_BOARDERS, () => {
        return boarderRepository.getAll();
    });
    ipcMain.handle(SAVE_BOARDERS, (_event, boarders) => {
        boarderRepository.saveAll(boarders);
        return true;
    });
}
//# sourceMappingURL=boarderHandlers.js.map