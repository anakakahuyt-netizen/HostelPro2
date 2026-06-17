import type { Boarder } from '../../../types';
export declare class BoarderRepository {
    getAll(): Boarder[];
    getById(id: string): Boarder | undefined;
    create(boarder: Boarder): void;
    update(id: string, patch: Partial<Boarder>): void;
    remove(id: string): void;
    saveAll(boarders: Boarder[]): void;
}
//# sourceMappingURL=boarderRepository.d.ts.map