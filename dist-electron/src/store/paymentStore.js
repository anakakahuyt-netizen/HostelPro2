import { create } from 'zustand';
import { initialPayments } from '../services/mockData';
import * as databaseAdapter from '../services/database/databaseAdapter';
import { showToast } from '../services/toast';
export const usePaymentStore = create((set, get) => {
    const persisted = databaseAdapter.getPayments();
    const initial = persisted.length ? persisted : initialPayments;
    return {
        payments: initial,
        addPayment: (p) => {
            if (p.amount < 0) {
                showToast('Payment amount cannot be negative');
                return;
            }
            set((s) => {
                const next = [p, ...s.payments];
                databaseAdapter.savePayments(next);
                return { payments: next };
            });
        },
        updatePayment: (id, patch) => {
            if (patch.amount !== undefined && patch.amount < 0) {
                showToast('Payment amount cannot be negative');
                return;
            }
            set((s) => {
                const next = s.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment));
                databaseAdapter.savePayments(next);
                return { payments: next };
            });
        },
        removePayment: (id) => set((s) => {
            const next = s.payments.filter((x) => x.id !== id);
            databaseAdapter.savePayments(next);
            return { payments: next };
        }),
        getPaymentsByBoarder: (boarderId) => get().payments.filter((p) => p.boarderId === boarderId),
    };
});
//# sourceMappingURL=paymentStore.js.map