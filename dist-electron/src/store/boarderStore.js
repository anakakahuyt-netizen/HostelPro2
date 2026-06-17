import { create } from 'zustand';
import { initialBoarders } from '../services/mockData';
import { useRoomStore } from './roomStore';
import * as databaseAdapter from '../services/database/databaseAdapter';
import { showToast } from '../services/toast';
export const useBoarderStore = create((set, get) => {
    const persisted = databaseAdapter.getBoarders();
    const initial = persisted.length ? persisted : initialBoarders;
    return {
        boarders: initial,
        addBoarder: (b) => {
            const roomsApi = useRoomStore.getState();
            const room = roomsApi.rooms.find((r) => r.id === b.room || r.roomNumber === b.room);
            if (room && room.occupied >= room.capacity) {
                showToast('Cannot assign boarder to a full room');
                return;
            }
            set((s) => {
                const next = [b, ...s.boarders];
                databaseAdapter.saveBoarders(next);
                return { boarders: next };
            });
            if (room)
                roomsApi.updateRoom(room.id, { occupied: Math.min(room.capacity, room.occupied + 1) });
        },
        updateBoarder: (id, patch) => {
            const prev = get().boarders.find((b) => b.id === id);
            const newRoomId = patch.room || prev?.room;
            const roomsApi = useRoomStore.getState();
            const newRoom = roomsApi.rooms.find((r) => r.id === newRoomId || r.roomNumber === newRoomId);
            if (newRoom && newRoom.occupied >= newRoom.capacity && prev?.room !== newRoomId) {
                showToast('Cannot move boarder to a full room');
                return;
            }
            set((s) => {
                const next = s.boarders.map((b) => (b.id === id ? { ...b, ...patch } : b));
                databaseAdapter.saveBoarders(next);
                return { boarders: next };
            });
            if (prev && prev.room !== newRoomId) {
                const oldRoom = roomsApi.rooms.find((r) => r.id === prev.room || r.roomNumber === prev.room);
                if (oldRoom)
                    roomsApi.updateRoom(oldRoom.id, { occupied: Math.max(0, oldRoom.occupied - 1) });
                if (newRoom)
                    roomsApi.updateRoom(newRoom.id, { occupied: Math.min(newRoom.capacity, newRoom.occupied + 1) });
            }
        },
        removeBoarder: (id) => {
            const boarder = get().boarders.find((b) => b.id === id);
            set((s) => {
                const next = s.boarders.filter((b) => b.id !== id);
                databaseAdapter.saveBoarders(next);
                return { boarders: next };
            });
            if (boarder) {
                const roomsApi = useRoomStore.getState();
                const room = roomsApi.rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room);
                if (room)
                    roomsApi.updateRoom(room.id, { occupied: Math.max(0, room.occupied - 1) });
            }
        },
    };
});
//# sourceMappingURL=boarderStore.js.map