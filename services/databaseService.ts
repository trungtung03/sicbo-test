
import { User } from '../types';

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
    depositQrImage: "",
    adminBankName: "Đang cập nhật",
    adminAccountName: "Đang cập nhật",
    adminAccountNumber: "Đang cập nhật"
  }
};

export const dbService = {
  getDB: (): DB => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return initialDB;
    try {
      const db = JSON.parse(data);
      // Đảm bảo cấu trúc object luôn đầy đủ
      return {
        ...initialDB,
        ...db,
        settings: { ...initialDB.settings, ...(db.settings || {}) },
        users: db.users || initialDB.users
      };
    } catch (e) {
      return initialDB;
    }
  },
  
  saveDB: (db: DB) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Phát sự kiện nội bộ cho tab hiện tại
    window.dispatchEvent(new Event('storage_updated'));
  },

  getAllUsers: () => dbService.getDB().users,

  deleteUser: (username: string) => {
    const db = dbService.getDB();
    db.users = db.users.filter(u => u.username !== username);
    dbService.saveDB(db);
  },

  updateUser: (username: string, updates: Partial<User>) => {
    const db = dbService.getDB();
    const idx = db.users.findIndex(u => u.username === username);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      dbService.saveDB(db);
    }
  },

  updateSettings: (newSettings: Partial<DB['settings']>) => {
    const db = dbService.getDB();
    db.settings = { ...db.settings, ...newSettings };
    dbService.saveDB(db);
  },

  getSettings: () => dbService.getDB().settings,

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

  getAdminOverride: () => dbService.getDB().currentOverride,

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
