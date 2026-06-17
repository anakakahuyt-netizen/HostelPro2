import type { Boarder, Room, Payment } from '../../types';
export declare function getBoarders(): Boarder[];
export declare function saveBoarders(boarders: Boarder[]): void;
export declare function getRooms(): Room[];
export declare function saveRooms(rooms: Room[]): void;
export declare function getPayments(): Payment[];
export declare function savePayments(payments: Payment[]): void;
declare const _default: {
    getBoarders: typeof getBoarders;
    saveBoarders: typeof saveBoarders;
    getRooms: typeof getRooms;
    saveRooms: typeof saveRooms;
    getPayments: typeof getPayments;
    savePayments: typeof savePayments;
};
export default _default;
//# sourceMappingURL=databaseAdapter.d.ts.map