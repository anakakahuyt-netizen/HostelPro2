import * as databaseAdapter from '../databaseAdapter';
// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class PaymentRepository {
    getAll() {
        return databaseAdapter.getPayments();
    }
    getById(id) {
        return this.getAll().find((payment) => payment.id === id);
    }
    create(payment) {
        const payments = [payment, ...this.getAll()];
        this.saveAll(payments);
    }
    update(id, patch) {
        const payments = this.getAll().map((payment) => (payment.id === id ? { ...payment, ...patch } : payment));
        this.saveAll(payments);
    }
    remove(id) {
        const payments = this.getAll().filter((payment) => payment.id !== id);
        this.saveAll(payments);
    }
    saveAll(payments) {
        databaseAdapter.savePayments(payments);
    }
}
//# sourceMappingURL=paymentRepository.js.map