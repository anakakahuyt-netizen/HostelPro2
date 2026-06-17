import { useBoarderStore } from '../store/boarderStore';
import { useRoomStore } from '../store/roomStore';
import { usePaymentStore } from '../store/paymentStore';
import * as storage from './storageService';
export function exportBackup() {
    const data = {
        boarders: useBoarderStore.getState().boarders,
        rooms: useRoomStore.getState().rooms,
        payments: usePaymentStore.getState().payments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostelpro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
export async function importBackup(file) {
    const text = await file.text();
    const obj = JSON.parse(text);
    const boarders = obj.boarders || [];
    const rooms = obj.rooms || [];
    const payments = obj.payments || [];
    useBoarderStore.setState({ boarders });
    storage.saveBoarders(boarders);
    useRoomStore.setState({ rooms });
    storage.saveRooms(rooms);
    usePaymentStore.setState({ payments });
    storage.savePayments(payments);
}
export default { exportBackup, importBackup };
//# sourceMappingURL=backup.js.map