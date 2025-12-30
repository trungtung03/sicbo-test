
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../constants';
import { dbService } from '../services/databaseService';

interface AdminPanelProps {
  onSetOverride: (dice: [number, number, number] | null) => void;
  currentOverride: [number, number, number] | null;
  totalTai: number;
  totalXiu: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onSetOverride, currentOverride, totalTai, totalXiu }) => {
  const [d1, setD1] = useState(1);
  const [d2, setD2] = useState(1);
  const [d3, setD3] = useState(1);
  const [settings, setSettings] = useState(dbService.getSettings());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        dbService.updateSettings({ depositQrImage: base64String });
        setSettings(prev => ({ ...prev, depositQrImage: base64String }));
        alert("Đã cập nhật ảnh QR nạp tiền mới!");
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBankInfo = (key: string, value: string) => {
    const newSettings = { ...settings, [key]: value };
    dbService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const forceResult = (type: 'TAI' | 'XIU' | 'TRIPLE') => {
    let newDice: [number, number, number];
    if (type === 'TAI') newDice = [4, 5, 6]; 
    else if (type === 'XIU') newDice = [1, 2, 3];
    else newDice = [6, 6, 6];
    onSetOverride(newDice);
  };

  const exportJSON = () => {
    const db = dbService.getDB();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tai_xiu_database.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // TÍNH NĂNG MỚI: XUẤT FILE .SQL CHO XAMPP
  const exportSQL = () => {
    const db = dbService.getDB();
    let sql = `-- Database Export for XAMPP/MySQL\n`;
    sql += `-- Generated on ${new Date().toLocaleString()}\n\n`;
    
    sql += `CREATE DATABASE IF NOT EXISTS \`tai_xiu_casino\`;\n`;
    sql += `USE \`tai_xiu_casino\`;\n\n`;

    // Table Users
    sql += `CREATE TABLE IF NOT EXISTS \`users\` (\n  \`username\` varchar(50) PRIMARY KEY,\n  \`password\` varchar(50) NOT NULL,\n  \`balance\` bigint NOT NULL,\n  \`isAdmin\` boolean DEFAULT false\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    
    db.users.forEach(u => {
      sql += `INSERT INTO \`users\` (\`username\`, \`password\`, \`balance\`, \`isAdmin\`) VALUES ('${u.username}', '${u.password || '123'}', ${u.balance}, ${u.isAdmin ? 1 : 0}) ON DUPLICATE KEY UPDATE balance=${u.balance};\n`;
    });

    // Table History
    sql += `\nCREATE TABLE IF NOT EXISTS \`session_history\` (\n  \`sessionId\` bigint PRIMARY KEY,\n  \`dice\` varchar(20) NOT NULL,\n  \`result\` int NOT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    
    db.sessionHistory.forEach(h => {
      sql += `INSERT INTO \`session_history\` (\`sessionId\`, \`dice\`, \`result\`) VALUES (${h.sessionId}, '${h.dice.join(',')}', ${h.result}) ON DUPLICATE KEY UPDATE result=${h.result};\n`;
    });

    // Table Settings
    sql += `\nCREATE TABLE IF NOT EXISTS \`settings\` (\n  \`key_name\` varchar(50) PRIMARY KEY,\n  \`value\` longtext NOT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    
    Object.entries(db.settings).forEach(([key, val]) => {
      // Escape single quotes for SQL
      const escapedVal = val.toString().replace(/'/g, "''");
      sql += `INSERT INTO \`settings\` (\`key_name\`, \`value\`) VALUES ('${key}', '${escapedVal}') ON DUPLICATE KEY UPDATE \`value\`='${escapedVal}';\n`;
    });

    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tai_xiu_xampp_import.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          dbService.saveDB(json);
          alert("Đã nhập dữ liệu thành công! Vui lòng tải lại trang.");
          window.location.reload();
        } catch (err) {
          alert("File không hợp lệ!");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 glass-panel border border-red-500/50 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[80vh] scrollbar-hide">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-red-500 italic tracking-tighter uppercase">Admin Control</h2>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
      </div>
      
      <div className="space-y-6">
        {/* Thống kê cược */}
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

        {/* QUẢN LÝ DỮ LIỆU SQL/JSON */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <p className="text-[10px] text-emerald-400 font-bold uppercase text-center">Xuất Database cho XAMPP</p>
          <button 
            onClick={exportSQL}
            className="w-full py-3 bg-emerald-600/20 border border-emerald-500 text-emerald-400 rounded-xl text-[11px] font-black hover:bg-emerald-600 hover:text-black transition-all shadow-lg shadow-emerald-900/20"
          >
            TẢI FILE .SQL (MYSQL)
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={exportJSON}
              className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[9px] font-bold"
            >
              XUẤT JSON
            </button>
            <label className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[9px] font-bold text-center cursor-pointer">
              NHẬP JSON
              <input type="file" accept=".json" onChange={importDatabase} className="hidden" />
            </label>
          </div>
        </div>

        {/* Điều khiển kết quả */}
        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-[10px] text-zinc-400 font-bold uppercase text-center">Điều khiển phiên tiếp</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => forceResult('TAI')} className="py-2 bg-red-900/40 border border-red-500 text-white rounded-xl text-[10px] font-black">ÉP TÀI</button>
            <button onClick={() => forceResult('XIU')} className="py-2 bg-blue-900/40 border border-blue-500 text-white rounded-xl text-[10px] font-black">ÉP XỈU</button>
            <button onClick={() => forceResult('TRIPLE')} className="py-2 bg-yellow-900/40 border border-yellow-500 text-white rounded-xl text-[10px] font-black">ÉP BÃO</button>
          </div>
        </div>

        {/* Cấu hình Nạp/Rút */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <p className="text-[10px] text-yellow-500 font-bold uppercase text-center">Cấu hình Nạp/Rút</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-[10px] text-zinc-400 cursor-pointer" />
          <div className="grid grid-cols-1 gap-2">
             <input placeholder="Ngân hàng" value={settings.adminBankName} onChange={(e) => updateBankInfo('adminBankName', e.target.value)} className="bg-zinc-800 border border-white/5 rounded-xl p-2 text-[10px] text-white" />
             <input placeholder="Số tài khoản" value={settings.adminAccountNumber} onChange={(e) => updateBankInfo('adminAccountNumber', e.target.value)} className="bg-zinc-800 border border-white/5 rounded-xl p-2 text-[10px] text-white" />
             <input placeholder="Tên chủ thẻ" value={settings.adminAccountName} onChange={(e) => updateBankInfo('adminAccountName', e.target.value)} className="bg-zinc-800 border border-white/5 rounded-xl p-2 text-[10px] text-white" />
          </div>
        </div>

        {/* Dice thủ công */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-[10px] text-zinc-400 font-bold uppercase mb-3 text-center">Kết quả Dice thủ công</p>
          <div className="flex gap-3 mb-4">
            {[setD1, setD2, setD3].map((set, i) => (
              <input key={i} type="number" min="1" max="6" className="w-full bg-zinc-800 border border-white/10 rounded-xl p-2 text-center font-black text-white" onChange={(e) => set(Number(e.target.value))} value={i === 0 ? d1 : i === 1 ? d2 : d3} />
            ))}
          </div>
          <button onClick={() => onSetOverride([d1, d2, d3])} className={`w-full py-3 rounded-2xl text-xs font-black ${currentOverride ? 'bg-zinc-700 text-zinc-400' : 'bg-red-600 text-white'}`}>
            {currentOverride ? `ĐÃ ĐẶT: ${currentOverride.join('-')}` : 'XÁC NHẬN DICE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
