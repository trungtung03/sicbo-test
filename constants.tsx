
import React from 'react';
import { BetCategory, BetOption } from './types';

export const BETTING_DURATION = 45; // 45 giây đặt cược
export const ROLL_DURATION = 3;     // 3 giây lắc bát
export const SHOW_DURATION = 12;    // 12 giây hiển thị kết quả
export const TOTAL_CYCLE = BETTING_DURATION + ROLL_DURATION + SHOW_DURATION; // Tổng 60s/phiên

export const SICBO_OPTIONS: BetOption[] = [
  { id: 'xiu', category: BetCategory.BIG_SMALL, label: 'XỈU (4-10)', value: 'SMALL', payout: 1 },
  { id: 'tai', category: BetCategory.BIG_SMALL, label: 'TÀI (11-17)', value: 'BIG', payout: 1 },
  ...[4, 17].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 60 })),
  ...[5, 16].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 30 })),
  ...[6, 15].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 18 })),
  ...[7, 14].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 12 })),
  ...[8, 13].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 8 })),
  ...[9, 10, 11, 12].map(n => ({ id: `total_${n}`, category: BetCategory.TOTAL, label: `${n}`, value: n, payout: 6 })),
  ...[1, 2, 3, 4, 5, 6].map(n => ({ id: `triple_${n}`, category: BetCategory.TRIPLE, label: `Bão ${n}`, value: n, payout: 180 })),
  { id: 'any_triple', category: BetCategory.TRIPLE, label: 'Bão Bất Kỳ', value: 'ANY', payout: 30 },
  ...[1, 2, 3, 4, 5, 6].map(n => ({ id: `single_${n}`, category: BetCategory.SINGLE, label: `${n}`, value: n, payout: 1 }))
];

export const MOCK_PLAYERS = [
  { id: '1', name: 'Đại Gia Phố Núi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: '2', name: 'Kiều Nữ Bạc Tỷ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: '3', name: 'Công Tử Bạc Liêu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: '4', name: 'Sát Thủ Casino', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: '5', name: 'Nữ Hoàng Soi Cầu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'G');
};

export const DiceIcon = ({ value, className }: { value: number; className?: string }) => {
  return (
    <div className={`w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl shadow-[0_4px_0_#ccc,inset_0_2px_4px_rgba(0,0,0,0.2)] flex items-center justify-center relative p-1.5 border-b-4 border-gray-300 ${className}`}>
      <div className={`grid grid-cols-3 grid-rows-3 gap-1 w-full h-full`}>
        {value === 1 && <div className="col-start-2 row-start-2 w-4 h-4 bg-red-600 rounded-full mx-auto my-auto shadow-inner" />}
        {value === 2 && (
          <>
            <div className="col-start-1 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
          </>
        )}
        {value === 3 && (
          <>
            <div className="col-start-1 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-2 row-start-2 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
          </>
        )}
        {value === 4 && (
          <>
            <div className="col-start-1 row-start-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
            <div className="col-start-3 row-start-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
            <div className="col-start-1 row-start-3 w-2.5 h-2.5 bg-red-600 rounded-full" />
            <div className="col-start-3 row-start-3 w-2.5 h-2.5 bg-red-600 rounded-full" />
          </>
        )}
        {value === 5 && (
          <>
            <div className="col-start-1 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-2 row-start-2 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-1 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
          </>
        )}
        {value === 6 && (
          <>
            <div className="col-start-1 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-1 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-1 row-start-2 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-2 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-1 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
            <div className="col-start-3 row-start-3 w-2.5 h-2.5 bg-black rounded-full" />
          </>
        )}
      </div>
    </div>
  );
};
