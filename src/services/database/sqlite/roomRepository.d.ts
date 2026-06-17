import type { Room } from '../../../types';
export declare class RoomRepository {
    getAll(): Room[];
    getById(id: string): Room | undefined;
    create(room: Room): void;
    update(id: string, patch: Partial<Room>): void;
    remove(id: string): void;
    saveAll(rooms: Room[]): void;
}
//# sourceMappingURL=roomRepository.d.ts.map