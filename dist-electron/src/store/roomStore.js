import { create } from 'zustand';
import { initialRooms } from '../services/mockData';
import * as databaseAdapter from '../services/database/databaseAdapter';
import { showToast } from '../services/toast';
export const useRoomStore = create((set, get) => {
    const persisted = databaseAdapter.getRooms();
    const initial = persisted.length ? persisted : initialRooms;
    return {
        rooms: initial,
        addRoom: (r) => {
            const exists = get().rooms.find((x) => x.roomNumber === r.roomNumber);
            if (exists) {
                showToast('Room number already exists');
                return;
            }
            set((s) => {
                const next = [r, ...s.rooms];
                databaseAdapter.saveRooms(next);
                return { rooms: next };
            });
        },
        updateRoom: (id, patch) => {
            set((s) => {
                const next = s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r));
                databaseAdapter.saveRooms(next);
                return { rooms: next };
            });
        },
        removeRoom: (id) => {
            set((s) => {
                const next = s.rooms.filter((r) => r.id !== id);
                databaseAdapter.saveRooms(next);
                return { rooms: next };
            });
        },
    };
});
//# sourceMappingURL=roomStore.js.map