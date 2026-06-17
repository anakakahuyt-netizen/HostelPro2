import type { Room } from '../types';
interface RoomState {
    rooms: Room[];
    addRoom: (r: Room) => void;
    updateRoom: (id: string, patch: Partial<Room>) => void;
    removeRoom: (id: string) => void;
}
export declare const useRoomStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RoomState>>;
export {};
//# sourceMappingURL=roomStore.d.ts.map