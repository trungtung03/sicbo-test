
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DiceTable from './components/DiceTable';
import WalletModal from './components/WalletModal';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import { 
  BetCategory, 
  User,
  UserBet,
  BetOption
} from './types';
import { 
  BETTING_DURATION,
  ROLL_DURATION,
  SHOW_DURATION,
  TOTAL_CYCLE,
  formatCurrency,
  SICBO_OPTIONS
} from './constants';
import { getMCCommentary } from './services/geminiService';
import { dbService } from './services/databaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState(dbService.getSettings());
  const [syncState, setSyncState] = useState({
    sessionId: 0,
    timeLeft: 0,
    phase: 'BETTING' as 'BETTING' | 'ROLLING' | 'SHOWING',
    dice: [1, 1, 1] as [number, number, number]
  });

  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [totalBets, setTotalBets] = useState<{ [key: string]: number }>({});
  const [betAmountInput, setBetAmountInput] = useState<number>(50000);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [mcMessage, setMcMessage] = useState<string>("Chào mừng các đại gia! Sòng bài đang hoạt động 24/7.");
  const [history, setHistory] = useState<any[]>([]);
  const [isBowlOpenedLocally, setIsBowlOpenedLocally] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<Array<{user: string, msg: string, time: string}>>([
    {user: 'Admin', msg: 'Chúc anh em hôm nay rực rỡ nhé!', time: '10:00'},
    {user: 'Dân Chơi 9x', msg: 'Vừa húp quả bão 6 ngọt lịm!', time: '10:05'}
  ]);
  const [chatInput, setChatInput] = useState('');
  const [serverActivities, setServerActivities] = useState<Array<{user: string, action: string, amount: string}>>([]);

  const lastProcessedSession = useRef<number>(-1);
  const lastResetSession = useRef<number>(-1);

  // 1. KIỂM TRA ĐĂNG NHẬP CŨ KHI LOAD TRANG
  useEffect(() => {
    const savedUsername = localStorage.getItem('activeUser');
    if (savedUsername) {
      const db = dbService.getDB();
      const user = db.users.find(u => u.username === savedUsername);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  // 2. LẮNG NGHE SỰ THAY ĐỔI CỦA DATABASE (TỪ ADMIN PANEL)
  useEffect(() => {
    const handleStorageChange = () => {
      const db = dbService.getDB();
      setSettings(db.settings);
      setHistory(db.sessionHistory);
      
      if (currentUser) {
        const updatedUser = db.users.find(u => u.username === currentUser.username);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }
    };
    window.addEventListener('storage_updated', handleStorageChange);
    return () => window.removeEventListener('storage_updated', handleStorageChange);
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('activeUser', user.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('activeUser');
    setCurrentUser(null);
  };

  const getDeterministicDice = (sessionId: number): [number, number, number] => {
    const override = dbService.getAdminOverride();
    if (override) return override;
    const seed = sessionId * 12345;
    const d1 = (seed % 6) + 1;
    const d2 = ((seed * 7) % 6) + 1;
    const d3 = ((seed * 13) % 6) + 1;
    return [d1, d2, d3] as [number, number, number];
  };

  useEffect(() => {
    const updateSync = () => {
      const now = Date.now();
      const totalSeconds = Math.floor(now / 1000);
      const currentSessionId = Math.floor(totalSeconds / TOTAL_CYCLE);
      const secondsInCycle = totalSeconds % TOTAL_CYCLE;

      let phase: 'BETTING' | 'ROLLING' | 'SHOWING' = 'BETTING';
      let timeLeft = 0;

      if (secondsInCycle < BETTING_DURATION) {
        phase = 'BETTING';
        timeLeft = BETTING_DURATION - secondsInCycle;
      } else if (secondsInCycle < BETTING_DURATION + ROLL_DURATION) {
        phase = 'ROLLING';
        timeLeft = 0;
      } else {
        phase = 'SHOWING';
        timeLeft = 0;
      }

      const dice = getDeterministicDice(currentSessionId);
      setSyncState({ sessionId: currentSessionId, timeLeft, phase, dice });

      if (phase === 'BETTING' && lastResetSession.current !== currentSessionId) {
        setUserBets([]);
        setTotalBets({});
        setIsBowlOpenedLocally(false);
        lastResetSession.current = currentSessionId;
      }

      if (phase === 'SHOWING' && lastProcessedSession.current !== currentSessionId) {
        dbService.addSessionToHistory(currentSessionId, dice);
        setHistory(dbService.getDB().sessionHistory);
        lastProcessedSession.current = currentSessionId;
      }
    };

    const interval = setInterval(updateSync, 1000);
    updateSync();
    setHistory(dbService.getDB().sessionHistory);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (syncState.phase === 'BETTING') {
      const activityInterval = setInterval(() => {
        const fakeUsers = ['Hùng Dubai', 'Vương Miện', 'Jack97', 'Sơn Tùng', 'Lily69', 'Mạnh Thường Quân'];
        const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        const actions = ['đã cược TÀI', 'đã cược XỈU', 'vừa tất tay', 'đã nạp 500K'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        setServerActivities(prev => [{
          user: randomUser,
          action: randomAction,
          amount: ''
        }, ...prev].slice(0, 5));
      }, 3000);
      return () => clearInterval(activityInterval);
    }
  }, [syncState.phase]);

  const handleOpenBowl = useCallback(() => {
    if (isBowlOpenedLocally || syncState.phase !== 'SHOWING') return;
    setIsBowlOpenedLocally(true);
    const winAmount = calculateWinnings(syncState.dice, userBets);
    if (winAmount > 0 && currentUser) {
      dbService.updateUserBalance(currentUser.username, winAmount);
      setCurrentUser(prev => prev ? ({ ...prev, balance: prev.balance + winAmount }) : null);
      const sum = syncState.dice.reduce((a, b) => a + b, 0);
      getMCCommentary({ result: sum, type: sum >= 11 ? 'TÀI' : 'XỈU' }, true, currentUser.balance + winAmount).then(setMcMessage);
    }
  }, [isBowlOpenedLocally, syncState.phase, syncState.dice, userBets, currentUser]);

  const calculateWinnings = (dice: [number, number, number], bets: UserBet[]) => {
    const sum = dice.reduce((a, b) => a + b, 0);
    const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
    let totalWin = 0;
    bets.forEach(bet => {
      let win = false;
      let multiplier = bet.payout;
      if (bet.category === BetCategory.BIG_SMALL && !isTriple) {
        if (bet.value === 'SMALL' && sum >= 4 && sum <= 10) win = true;
        if (bet.value === 'BIG' && sum >= 11 && sum <= 17) win = true;
      }
      if (win) totalWin += bet.amount + (bet.amount * multiplier);
    });
    return totalWin;
  };

  const placeBet = (option: BetOption) => {
    if (!currentUser || syncState.phase !== 'BETTING') return;
    if (betAmountInput > currentUser.balance) {
      setMcMessage("Số dư không đủ!");
      return;
    }
    dbService.updateUserBalance(currentUser.username, -betAmountInput);
    setUserBets(prev => {
      const idx = prev.findIndex(b => b.optionId === option.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].amount += betAmountInput;
        return next;
      }
      return [...prev, { optionId: option.id, amount: betAmountInput, category: option.category, payout: option.payout, value: option.value }];
    });
    setTotalBets(prev => ({ ...prev, [option.id]: (prev[option.id] || 0) + betAmountInput }));
    setCurrentUser(prev => prev ? ({ ...prev, balance: prev.balance - betAmountInput }) : null);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !currentUser) return;
    const newMsg = { user: currentUser.username, msg: chatInput, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(prev => [...prev, newMsg].slice(-20));
    setChatInput('');
  };

  if (!currentUser) return <AuthModal onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 pointer-events-none">
        <div className="bg-zinc-900/95 border border-yellow-600/30 rounded-full px-8 py-3 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
           <div className="flex flex-col items-center border-r border-white/10 pr-6">
             <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Phiên #</span>
             <span className="text-yellow-500 font-black text-xl italic">{syncState.sessionId}</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Trạng thái</span>
             <span className={`text-xl font-black italic ${syncState.phase === 'BETTING' ? 'text-green-500' : 'text-red-500'}`}>
               {syncState.phase === 'BETTING' ? `CÒN ${syncState.timeLeft}S` : 'GIẬT BÁT'}
             </span>
           </div>
           <div className="flex flex-col items-center border-l border-white/10 pl-6">
             <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Online</span>
             <span className="text-white font-black text-xl italic flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                {256 + (syncState.sessionId % 50)}
             </span>
           </div>
        </div>
      </div>

      <header className="w-full glass-panel p-4 mt-24 flex justify-between items-center px-6 md:px-12 border-b border-yellow-600/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-yellow-500 overflow-hidden shadow-lg">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} alt="Avatar" />
          </div>
          <div>
            <div className="text-white font-black text-sm uppercase flex items-center gap-2">
              {currentUser.username}
              <button onClick={handleLogout} className="text-[8px] text-zinc-500 hover:text-red-500 uppercase font-bold underline">Thoát</button>
            </div>
            <div onClick={() => setIsWalletOpen(true)} className="text-yellow-500 font-black text-md cursor-pointer">{formatCurrency(currentUser.balance)}</div>
          </div>
        </div>
        <div className="hidden md:block bg-yellow-950/40 px-6 py-2 rounded-2xl border border-yellow-600/20 text-[11px] italic text-yellow-100 max-w-md text-center">"{mcMessage}"</div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass-panel h-[500px] rounded-3xl border border-white/5 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phòng Chat Online</h3>
                <span className="text-[8px] bg-green-500 text-black px-2 py-0.5 rounded-full font-bold">LIVE</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {chatMessages.map((m, i) => (
                  <div key={i} className="animate-slide-in">
                    <span className="text-yellow-500 text-[10px] font-black uppercase">{m.user}: </span>
                    <span className="text-zinc-300 text-xs">{m.msg}</span>
                    <span className="text-[8px] text-zinc-600 ml-2">{m.time}</span>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Nhập nội dung..." 
                  className="flex-1 bg-zinc-800 border-none rounded-xl px-4 py-2 text-xs text-white focus:ring-1 ring-yellow-500"
                />
                <button onClick={sendChat} className="bg-yellow-600 text-black px-4 py-2 rounded-xl text-xs font-black">GỬI</button>
             </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-white/5">
             <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-4 text-center">Hoạt động Server</h3>
             <div className="space-y-3">
                {serverActivities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] animate-pulse">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                     <span className="text-zinc-300 font-bold">{a.user}</span>
                     <span className="text-zinc-500">{a.action}</span>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        <div className="lg:col-span-6 flex flex-col items-center">
          <DiceTable dice={syncState.dice} isRolling={syncState.phase === 'ROLLING'} isBowlOpened={isBowlOpenedLocally} timeLeft={syncState.timeLeft} onOpenBowl={handleOpenBowl} />
          <div className="w-full mt-12 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {SICBO_OPTIONS.filter(o => o.category === BetCategory.BIG_SMALL).map(opt => {
                const userBet = userBets.find(b => b.optionId === opt.id);
                const totalOnThis = totalBets[opt.id] || 0;
                return (
                  <button key={opt.id} onClick={() => placeBet(opt)} disabled={syncState.phase !== 'BETTING'} className={`py-12 rounded-[2.5rem] border-4 transition-all flex flex-col items-center relative overflow-hidden shadow-2xl ${userBet ? 'border-yellow-500 bg-yellow-950/40 scale-105' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                    <span className={`text-7xl font-black italic ${opt.id === 'tai' ? 'text-red-500' : 'text-blue-500'}`}>{opt.label.split(' ')[0]}</span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-2 tracking-widest uppercase">{opt.label.split(' ')[1]}</span>
                    <div className="mt-4 flex flex-col items-center">
                       <span className="text-[8px] text-zinc-500 uppercase font-bold">Tổng cược</span>
                       <span className="text-sm font-black text-white">{formatCurrency(totalOnThis)}</span>
                    </div>
                    {userBet && <div className="absolute top-6 right-6 bg-yellow-600 text-black px-4 py-1 rounded-full font-black text-[10px] shadow-xl animate-bounce">{formatCurrency(userBet.amount)}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">Mức cược</span>
            <div className="text-3xl font-black text-gold italic mb-8">{formatCurrency(betAmountInput)}</div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[10000, 50000, 100000, 500000, 1000000, 5000000].map(v => (
                <button key={v} onClick={() => setBetAmountInput(v)} className={`py-4 rounded-2xl text-[10px] font-black transition-all ${betAmountInput === v ? 'bg-yellow-600 text-black' : 'bg-zinc-800/50 text-zinc-400'}`}>
                  {v >= 1000000 ? `${v/1000000}M` : `${v/1000}K`}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-white/5 h-[300px] overflow-hidden flex flex-col">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase mb-4 tracking-widest">Lịch sử soi cầu</h3>
            <div className="grid grid-cols-5 gap-2 overflow-y-auto scrollbar-hide">
              {history.map((h, i) => (
                <div key={i} className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-black border-2 ${h.result >= 11 ? 'bg-red-950 border-red-500/50 text-red-500' : 'bg-blue-950 border-blue-500/50 text-blue-500'}`}>
                  {h.result}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {currentUser.isAdmin && (
        <AdminPanel 
          onSetOverride={(d) => dbService.setAdminOverride(d)} 
          currentOverride={dbService.getAdminOverride()}
          totalTai={totalBets['tai'] || 0}
          totalXiu={totalBets['xiu'] || 0}
        />
      )}

      <WalletModal 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
        balance={currentUser.balance} 
        settings={settings}
        onUpdateBalance={(newVal) => {
          dbService.updateUserBalance(currentUser.username, newVal - currentUser.balance);
          // UI tự động cập nhật qua useEffect lắng nghe storage_updated
        }} 
      />
    </div>
  );
};

export default App;
