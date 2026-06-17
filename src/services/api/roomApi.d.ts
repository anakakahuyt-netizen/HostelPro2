import type { Room } from '../../types';
export declare function getAll(): Room[];
export declare function saveAll(rooms: Room[]): void;
export declare function add(room: Room): void;
export declare function update(id: string, patch: Partial<Room>): void;
export declare function remove(id: string): void;
declare const _default: {
    getAll: typeof getAll;
    saveAll: typeof saveAll;
    add: typeof add;
    update: typeof update;
    remove: typeof remove;
};
export default _default;
//# sourceMappingURL=roomApi.d.ts.map