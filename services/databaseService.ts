
import { User, BetType } from '../types';

const STORAGE_KEY = 'tai_xiu_db_v2';

interface DB {
  users: User[];
  sessionHistory: Array<{ sessionId: number, dice: [number, number, number], result: number }>;
  currentOverride: [number, number, number] | null;
  settings: {
    depositQrImage: string;
    adminBankName: string;
    adminAccountName: string;
    adminAccountNumber: string;
  };
}

const initialDB: DB = {
  users: [
    { username: 'admin', password: '123', balance: 999999999, isAdmin: true },
    { username: 'user1', password: '123', balance: 1000000 }
  ],
  sessionHistory: [],
  currentOverride: null,
  settings: {
    depositQrImage: "https://i.ibb.co/LzfNqXQ/IMG-20240321-WA0000.jpg",
    adminBankName: "MB BANK",
    adminAccountName: "TRINH HUU DUY",
    adminAccountNumber: "0123456789"
  }
};

export const dbService = {
  getDB: (): DB => {
    const data = localStorage.getItem(STORAGE_KEY);
    const db = data ? JSON.parse(data) : initialDB;
    // Đảm bảo settings luôn tồn tại nếu nâng cấp từ bản cũ
    if (!db.settings) db.settings = initialDB.settings;
    return db;
  },
  
  saveDB: (db: DB) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  },

  updateSettings: (newSettings: Partial<DB['settings']>) => {
    const db = dbService.getDB();
    db.settings = { ...db.settings, ...newSettings };
    dbService.saveDB(db);
  },

  getSettings: () => {
    return dbService.getDB().settings;
  },

  updateUserBalance: (username: string, amount: number) => {
    const db = dbService.getDB();
    const user = db.users.find(u => u.username === username);
    if (user) {
      user.balance += amount;
      dbService.saveDB(db);
    }
  },

  setAdminOverride: (dice: [number, number, number] | null) => {
    const db = dbService.getDB();
    db.currentOverride = dice;
    dbService.saveDB(db);
  },

  getAdminOverride: () => {
    return dbService.getDB().currentOverride;
  },

  addSessionToHistory: (sessionId: number, dice: [number, number, number]) => {
    const db = dbService.getDB();
    if (db.sessionHistory.some(h => h.sessionId === sessionId)) return;
    
    const sum = dice.reduce((a, b) => a + b, 0);
    db.sessionHistory.unshift({ sessionId, dice, result: sum });
    db.sessionHistory = db.sessionHistory.slice(0, 50);
    db.currentOverride = null;
    dbService.saveDB(db);
  }
};
