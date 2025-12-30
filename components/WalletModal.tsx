
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../constants';
import { dbService } from '../services/databaseService';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, balance, onUpdateBalance }) => {
  const [amount, setAmount] = useState<number>(100000);
  const [tab, setTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [settings, setSettings] = useState(dbService.getSettings());

  // Cập nhật settings mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSettings(dbService.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (tab === 'DEPOSIT') {
      onUpdateBalance(balance + amount);
      alert(`Đã gửi yêu cầu nạp ${formatCurrency(amount)}. Admin sẽ duyệt trong vài phút.`);
    } else {
      if (amount > balance) {
        alert("Số dư không đủ!");
        return;
      }
      onUpdateBalance(balance - amount);
      alert(`Đã gửi yêu cầu rút ${formatCurrency(amount)}.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border-2 border-yellow-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="flex bg-zinc-800/50">
          <button onClick={() => setTab('DEPOSIT')} className={`flex-1 py-5 font-black tracking-widest text-sm transition-all ${tab === 'DEPOSIT' ? 'text-yellow-500 bg-zinc-900 border-b-2 border-yellow-500' : 'text-gray-500'}`}>NẠP TIỀN</button>
          <button onClick={() => setTab('WITHDRAW')} className={`flex-1 py-5 font-black tracking-widest text-sm transition-all ${tab === 'WITHDRAW' ? 'text-yellow-500 bg-zinc-900 border-b-2 border-yellow-500' : 'text-gray-500'}`}>RÚT TIỀN</button>
        </div>

        <div className="p-6 md:p-8">
          {tab === 'DEPOSIT' ? (
            <div className="flex flex-col items-center">
              <div className="mb-4 w-full text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Số dư của bạn</span>
                <div className="text-3xl font-black text-white mt-1">{formatCurrency(balance)}</div>
              </div>

              <div className="w-full flex flex-col gap-6">
                <div className="flex flex-col items-center bg-white p-2 rounded-2xl shadow-xl overflow-hidden min-h-[250px] justify-center">
                  <img 
                    src={settings.depositQrImage}
                    alt="QR Nạp Tiền" 
                    className="w-full max-w-[280px] aspect-square object-contain rounded-xl"
                  />
                  <div className="bg-yellow-500 w-full text-center py-2 mt-2 rounded-lg">
                    <span className="text-[10px] text-black font-black uppercase tracking-tighter">QUÉT MÃ ĐỂ NẠP TỰ ĐỘNG</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Ngân hàng</p>
                      <p className="text-xs font-black text-white">{settings.adminBankName}</p>
                   </div>
                   <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Số tài khoản</p>
                      <p className="text-xs font-black text-white tracking-widest">{settings.adminAccountNumber}</p>
                   </div>
                   <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Chủ tài khoản</p>
                      <p className="text-xs font-black text-white">{settings.adminAccountName}</p>
                   </div>
                   <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Nội dung</p>
                      <p className="text-xs font-black text-yellow-500 uppercase">NAP {localStorage.getItem('currentUser') || 'GUEST'}</p>
                   </div>
                </div>
              </div>

              <div className="w-full mt-6">
                <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-2 ml-1">Số tiền muốn nạp</label>
                <div className="relative">
                  <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-6 text-white text-2xl font-black focus:outline-none focus:border-yellow-500 transition-all" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-black">G</div>
                </div>
              </div>

              <div className="flex gap-4 w-full mt-8">
                <button onClick={onClose} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-xs">ĐÓNG</button>
                <button onClick={handleSubmit} className="flex-[2] py-4 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-transform">XÁC NHẬN ĐÃ CHUYỂN</button>
              </div>
            </div>
          ) : (
            <div>
              {/* Rút tiền giữ nguyên */}
              <div className="mb-6">
                <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-2">Số dư khả dụng</label>
                <div className="text-4xl font-black text-white tracking-tighter">{formatCurrency(balance)}</div>
              </div>
              <div className="space-y-4 mb-8">
                <input placeholder="Nhập STK của bạn" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-bold" />
                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 px-6 text-white text-2xl font-black" />
              </div>
              <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-xs">HỦY</button>
                <button onClick={handleSubmit} className="flex-[2] py-4 bg-zinc-700 text-white rounded-2xl font-black text-xs shadow-xl">RÚT TIỀN</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
