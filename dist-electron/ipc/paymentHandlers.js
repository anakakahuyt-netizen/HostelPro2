import { ipcMain } from 'electron';
import { PaymentRepository } from '../../src/services/database/sqlite/paymentRepository';
import { GET_PAYMENTS, SAVE_PAYMENTS } from '../ipcChannels';
const paymentRepository = new PaymentRepository();
// Payment IPC handlers currently delegate to the repository layer.
// Future SQLite handlers will use prepared statements and a real database connection.
export function registerPaymentHandlers() {
    ipcMain.handle(GET_PAYMENTS, () => {
        return paymentRepository.getAll();
    });
    ipcMain.handle(SAVE_PAYMENTS, (_event, payments) => {
        paymentRepository.saveAll(payments);
        return true;
    });
}
//# sourceMappingURL=paymentHandlers.js.map