import type { Payment } from '../../types';
export declare function getAll(): Payment[];
export declare function saveAll(payments: Payment[]): void;
export declare function add(payment: Payment): void;
export declare function update(id: string, patch: Partial<Payment>): void;
export declare function remove(id: string): void;
declare const _default: {
    getAll: typeof getAll;
    saveAll: typeof saveAll;
    add: typeof add;
    update: typeof update;
    remove: typeof remove;
};
export default _default;
//# sourceMappingURL=paymentApi.d.ts.map