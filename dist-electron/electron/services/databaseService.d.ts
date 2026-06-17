import Database from 'better-sqlite3';
export declare function initializeDatabase(): void;
export declare function openDatabase(): Database.Database | null;
export declare function closeDatabase(): void;
export declare function isDatabaseReady(): boolean;
export declare function getDatabase(): Database.Database;
export declare function migrateLocalStorage(boarders: unknown[], rooms: unknown[], payments: unknown[]): boolean;
//# sourceMappingURL=databaseService.d.ts.map