
import React, { useState } from 'react';
import { dbService } from '../services/databaseService';
import { User } from '../types';

interface AuthModalProps {
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const db = dbService.getDB();

    if (isLogin) {
      const user = db.users.find(u => u.username === username && u.password === password);
      if (user) onLogin(user);
      else alert('Sai tài khoản hoặc mật khẩu!');
    } else {
      if (db.users.find(u => u.username === username)) {
        alert('Tài khoản đã tồn tại!');
        return;
      }
      // Người chơi mới khởi đầu với 0 Gold theo yêu cầu
      const newUser: User = { username, password, balance: 0 };
      db.users.push(newUser);
      dbService.saveDB(db);
      alert('Đăng ký thành công! Hãy nạp tiền để bắt đầu chơi.');
      setIsLogin(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="bg-zinc-900 border-2 border-yellow-600/50 rounded-3xl w-full max-w-sm p-8 shadow-[0_0_100px_rgba(212,175,55,0.1)]">
        <h2 className="text-3xl font-black text-center text-white mb-2 casino-font tracking-widest">
          {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
        </h2>
        <p className="text-gray-500 text-center text-xs mb-8 uppercase tracking-widest">Sòng Bài Thượng Lưu</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tên tài khoản</label>
            <input 
              required
              type="text" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
            <input 
              required
              type="password" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black rounded-xl shadow-lg shadow-yellow-600/20 mt-4 transition-transform active:scale-95">
            {isLogin ? 'VÀO SÒNG BÀI' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 text-xs hover:text-yellow-500 underline"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
