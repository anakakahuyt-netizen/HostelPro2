import type { Boarder } from '../../types';
export declare function getAll(): Boarder[];
export declare function saveAll(boarders: Boarder[]): void;
export declare function add(boarder: Boarder): void;
export declare function update(id: string, patch: Partial<Boarder>): void;
export declare function remove(id: string): void;
declare const _default: {
    getAll: typeof getAll;
    saveAll: typeof saveAll;
    add: typeof add;
    update: typeof update;
    remove: typeof remove;
};
export default _default;
//# sourceMappingURL=boarderApi.d.ts.map