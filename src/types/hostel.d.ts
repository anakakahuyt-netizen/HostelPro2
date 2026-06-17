export type BoarderStatus = 'Active' | 'Pending' | 'Checked-out';
export interface Boarder {
    id: string;
    name: string;
    email: string;
    phone: string;
    room: string;
    monthlyRent: number;
    status: BoarderStatus;
    checkIn: string;
    checkOut: string;
}
export type RoomStatus = 'Available' | 'Occupied' | 'Limited' | 'Maintenance';
export interface Room {
    id: string;
    roomNumber: string;
    name?: string;
    type: 'Single' | 'Double' | 'Triple' | 'Quad';
    floor: number;
    capacity: number;
    occupied: number;
    price: number;
    status: RoomStatus;
    amenities: string[];
}
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';
export interface Payment {
    id: string;
    boarderId: string;
    guest: string;
    room: string;
    amount: number;
    date: string;
    dueDate: string;
    status: PaymentStatus;
    method: string;
}
//# sourceMappingURL=hostel.d.ts.map