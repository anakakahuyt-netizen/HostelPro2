import type { Boarder } from '../types';
interface BoarderState {
    boarders: Boarder[];
    addBoarder: (b: Boarder) => void;
    updateBoarder: (id: string, patch: Partial<Boarder>) => void;
    removeBoarder: (id: string) => void;
}
export declare const useBoarderStore: import("zustand").UseBoundStore<import("zustand").StoreApi<BoarderState>>;
export {};
//# sourceMappingURL=boarderStore.d.ts.map