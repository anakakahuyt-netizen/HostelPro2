export const initialRooms = [
    { id: 'R-101', roomNumber: 'A-102', name: 'Maple Suite', type: 'Quad', floor: 1, capacity: 4, occupied: 4, price: 420, status: 'Occupied', amenities: ['AC', 'WiFi', 'Bathroom', 'Balcony'] },
    { id: 'R-102', roomNumber: 'B-205', name: 'Oak Hall', type: 'Triple', floor: 1, capacity: 3, occupied: 2, price: 350, status: 'Limited', amenities: ['AC', 'WiFi', 'Bathroom'] },
    { id: 'R-103', roomNumber: 'C-108', name: 'Pine Studio', type: 'Double', floor: 1, capacity: 2, occupied: 0, price: 300, status: 'Available', amenities: ['AC', 'WiFi', 'Bathroom'] },
    { id: 'R-201', roomNumber: 'A-203', name: 'Cedar Room', type: 'Single', floor: 2, capacity: 1, occupied: 1, price: 200, status: 'Occupied', amenities: ['Fan', 'WiFi'] },
    { id: 'R-202', roomNumber: 'B-301', name: 'Birch Suite', type: 'Double', floor: 2, capacity: 2, occupied: 2, price: 320, status: 'Occupied', amenities: ['AC', 'WiFi', 'Bathroom', 'Desk'] },
    { id: 'R-203', roomNumber: 'C-205', name: 'Willow Wing', type: 'Triple', floor: 2, capacity: 3, occupied: 2, price: 380, status: 'Limited', amenities: ['AC', 'WiFi', 'Bathroom', 'Lounge'] },
];
export const initialBoarders = [
    { id: 'B-001', name: 'Nina Patel', email: 'nina@example.com', phone: '+1 555-0123', room: 'R-101', monthlyRent: 420, status: 'Active', checkIn: '2026-03-02', checkOut: '' },
    { id: 'B-002', name: 'Marcus Lee', email: 'marcus@example.com', phone: '+1 555-0456', room: 'R-102', monthlyRent: 350, status: 'Active', checkIn: '2026-04-11', checkOut: '' },
    { id: 'B-003', name: 'Sara Wong', email: 'sara@example.com', phone: '+1 555-0789', room: 'R-103', monthlyRent: 300, status: 'Active', checkIn: '2026-05-01', checkOut: '' },
    { id: 'B-004', name: 'James Ahmed', email: 'james@example.com', phone: '+1 555-0912', room: 'R-201', monthlyRent: 380, status: 'Pending', checkIn: '2026-02-12', checkOut: '' },
];
export const initialPayments = [
    { id: 'PAY-0001', boarderId: 'B-001', guest: 'Nina Patel', room: 'R-101', amount: 420, date: '2026-06-15', dueDate: '2026-06-01', status: 'Paid', method: 'Card' },
    { id: 'PAY-0002', boarderId: 'B-002', guest: 'Marcus Lee', room: 'R-102', amount: 350, date: '2026-06-16', dueDate: '2026-06-01', status: 'Paid', method: 'Transfer' },
    { id: 'PAY-0003', boarderId: 'B-003', guest: 'Sara Wong', room: 'R-103', amount: 520, date: '2026-06-10', dueDate: '2026-06-01', status: 'Paid', method: 'Card' },
    { id: 'PAY-0004', boarderId: 'B-004', guest: 'James Ahmed', room: 'R-201', amount: 380, date: '', dueDate: '2026-06-01', status: 'Pending', method: '-' },
];
//# sourceMappingURL=mockData.js.map