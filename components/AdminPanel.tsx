
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../constants';
import { dbService } from '../services/databaseService';
import { User } from '../types';

interface AdminPanelProps {
  onSetOverride: (dice: [number, number, number] | null) => void;
  currentOverride: [number, number, number] | null;
  totalTai: number;
  totalXiu: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onSetOverride, currentOverride, totalTai, totalXiu }) => {
  const [activeTab, setActiveTab] = useState<'GAME' | 'USERS' | 'DATABASE' | 'CONFIG'>('GAME');
  const [users, setUsers] = useState<User[]>([]);
  const [rawJson, setRawJson] = useState('');
  const [settings, setSettings] = useState(dbService.getSettings());

  useEffect(() => {
    if (activeTab === 'USERS') {
      setUsers(dbService.getAllUsers());
    } else if (activeTab === 'DATABASE') {
      setRawJson(JSON.stringify(dbService.getDB(), null, 2));
    }
  }, [activeTab]);

  const handleUpdateBalance = (username: string, currentBalance: number) => {
    const amountStr = prompt(`Nhập số Gold muốn cộng/trừ cho ${username} (VD: 50000 hoặc -20000):`);
    if (amountStr !== null) {
      const amount = parseInt(amountStr);
      if (!isNaN(amount)) {
        dbService.updateUserBalance(username, amount);
        setUsers(dbService.getAllUsers());
        alert('Đã cập nhật số dư!');
      }
    }
  };

  const handleSaveRawJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      dbService.saveDB(parsed);
      alert('Đã lưu database mới! Trang sẽ tải lại.');
      window.location.reload();
    } catch (e) {
      alert('Lỗi JSON không hợp lệ!');
    }
  };

  const updateBankInfo = (key: string, value: string) => {
    const newSettings = { ...settings, [key]: value };
    dbService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[400px] glass-panel border border-red-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header & Tabs */}
      <div className="bg-red-600/10 p-4 border-b border-red-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-red-500 italic uppercase">Hệ thống Admin</h2>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {['GAME', 'USERS', 'DATABASE', 'CONFIG'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${
                activeTab === t ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {t === 'GAME' ? 'ĐIỀU KHIỂN' : t === 'USERS' ? 'NGƯỜI CHƠI' : t === 'DATABASE' ? 'DỮ LIỆU' : 'CẤU HÌNH'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        {activeTab === 'GAME' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Tổng Tài</p>
                <p className="text-sm font-black text-red-400">{formatCurrency(totalTai)}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Tổng Xỉu</p>
                <p className="text-sm font-black text-blue-400">{formatCurrency(totalXiu)}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-[10px] text-zinc-400 font-bold uppercase text-center">Ép kết quả phiên tới</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => onSetOverride([4, 5, 6])} className="py-2 bg-red-900/40 border border-red-500 text-white rounded-xl text-[10px] font-black">ÉP TÀI</button>
                <button onClick={() => onSetOverride([1, 2, 3])} className="py-2 bg-blue-900/40 border border-blue-500 text-white rounded-xl text-[10px] font-black">ÉP XỈU</button>
                <button onClick={() => onSetOverride([6, 6, 6])} className="py-2 bg-yellow-900/40 border border-yellow-500 text-white rounded-xl text-[10px] font-black">ÉP BÃO</button>
              </div>
              {currentOverride && (
                <button onClick={() => onSetOverride(null)} className="w-full py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[9px] font-bold">HỦY ÉP KẾT QUẢ</button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
               <p className="text-[10px] text-zinc-400 font-bold uppercase italic">Tổng: {users.length} người</p>
            </div>
            {users.map((u) => (
              <div key={u.username} className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-white">{u.username} {u.isAdmin && <span className="text-[8px] text-red-500">[ADMIN]</span>}</p>
                  <p className="text-[10px] text-yellow-500 font-bold">{formatCurrency(u.balance)}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleUpdateBalance(u.username, u.balance)} className="bg-emerald-600 text-white p-1.5 rounded-lg text-[9px] font-bold">SỬA TIỀN</button>
                   {!u.isAdmin && (
                     <button onClick={() => { if(confirm('Xóa người dùng này?')) { dbService.deleteUser(u.username); setUsers(dbService.getAllUsers()); } }} className="bg-red-900/50 text-red-500 p-1.5 rounded-lg text-[9px] font-bold">XÓA</button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'DATABASE' && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase text-center mb-2 italic">Copy/Paste JSON để backup hoặc khôi phục</p>
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="w-full h-64 bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-emerald-400 focus:outline-none"
            />
            <button onClick={handleSaveRawJson} className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg">LƯU THAY ĐỔI DỮ LIỆU</button>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="space-y-4">
             <div className="bg-zinc-800/30 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] text-yellow-500 font-bold uppercase text-center mb-2">Thông tin thanh toán</p>
                <input placeholder="Tên Ngân hàng" value={settings.adminBankName} onChange={(e) => updateBankInfo('adminBankName', e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 text-xs text-white" />
                <input placeholder="Số tài khoản" value={settings.adminAccountNumber} onChange={(e) => updateBankInfo('adminAccountNumber', e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 text-xs text-white" />
                <input placeholder="Tên chủ thẻ" value={settings.adminAccountName} onChange={(e) => updateBankInfo('adminAccountName', e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 text-xs text-white" />
                <p className="text-[9px] text-zinc-500 italic mt-2">Dán link ảnh QR hoặc base64 vào đây:</p>
                <textarea value={settings.depositQrImage} onChange={(e) => updateBankInfo('depositQrImage', e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-xl p-2 text-[8px] h-20 text-zinc-400 font-mono" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
