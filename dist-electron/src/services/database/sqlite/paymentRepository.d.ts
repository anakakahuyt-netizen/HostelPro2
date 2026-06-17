import type { Payment } from '../../../types';
export declare class PaymentRepository {
    getAll(): Payment[];
    getById(id: string): Payment | undefined;
    create(payment: Payment): void;
    update(id: string, patch: Partial<Payment>): void;
    remove(id: string): void;
    saveAll(payments: Payment[]): void;
}
//# sourceMappingURL=paymentRepository.d.ts.map