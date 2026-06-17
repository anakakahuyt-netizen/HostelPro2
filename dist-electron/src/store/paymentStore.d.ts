import type { Payment } from '../types';
interface PaymentState {
    payments: Payment[];
    addPayment: (p: Payment) => void;
    updatePayment: (id: string, patch: Partial<Payment>) => void;
    removePayment: (id: string) => void;
    getPaymentsByBoarder: (boarderId: string) => Payment[];
}
export declare const usePaymentStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PaymentState>>;
export {};
//# sourceMappingURL=paymentStore.d.ts.map