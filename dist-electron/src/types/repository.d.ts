import type { Boarder, Room, Payment } from './hostel';
export interface Repository<T> {
    getAll(): T[];
    getById(id: string): T | undefined;
    create(item: T): void;
    update(id: string, patch: Partial<T>): void;
    remove(id: string): void;
}
export type BoarderRepository = Repository<Boarder>;
export type RoomRepository = Repository<Room>;
export type PaymentRepository = Repository<Payment>;
//# sourceMappingURL=repository.d.ts.map