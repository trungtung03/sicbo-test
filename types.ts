
export enum BetCategory {
  BIG_SMALL = 'BIG_SMALL',
  TOTAL = 'TOTAL',
  TRIPLE = 'TRIPLE',
  DOUBLE = 'DOUBLE',
  SINGLE = 'SINGLE'
}

// Added BetType enum to fix import error in databaseService.ts
export enum BetType {
  TAI = 'TAI',
  XIU = 'XIU'
}

export interface BetOption {
  id: string;
  category: BetCategory;
  label: string;
  value: any;
  payout: number;
}

export interface User {
  username: string;
  password?: string;
  balance: number;
  isAdmin?: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
}

export interface UserBet {
  optionId: string;
  amount: number;
  category: BetCategory;
  payout: number;
  value: any;
}

export interface GameState {
  sessionId: number;
  dice: [number, number, number];
  isRolling: boolean;
  isBowlOpened: boolean;
  timeLeft: number;
  history: Array<{
    sessionId: number;
    result: number;
    dice: [number, number, number];
  }>;
  totalBets: { [optionId: string]: number };
  adminOverride: [number, number, number] | null;
}