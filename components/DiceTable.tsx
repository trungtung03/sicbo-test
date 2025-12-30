
import React, { useState, useRef, useEffect } from 'react';
import { DiceIcon } from '../constants';

interface DiceTableProps {
  dice: [number, number, number];
  isRolling: boolean;
  isBowlOpened: boolean;
  timeLeft: number;
  onOpenBowl: () => void;
}

const DiceTable: React.FC<DiceTableProps> = ({ dice, isRolling, isBowlOpened, timeLeft, onOpenBowl }) => {
  const [bowlOffset, setBowlOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const threshold = 130; // Khoảng cách kéo tối thiểu để bát bay đi

  // Đồng bộ hóa trạng thái bát khi phiên mới bắt đầu
  useEffect(() => {
    if (!isBowlOpened) {
      setBowlOffset({ x: 0, y: 0 });
    } else if (bowlOffset.x === 0 && bowlOffset.y === 0) {
      // Nếu trạng thái là opened nhưng bát chưa bay (ví dụ do sync tự động), 
      // cho bát bay tự động ra một góc
      setBowlOffset({ x: 400, y: -400 });
    }
  }, [isBowlOpened]);

  const handleStart = (clientX: number, clientY: number) => {
    // Chỉ cho phép giật bát khi đã ngừng cược, không đang lắc và bát chưa mở
    if (isRolling || isBowlOpened || timeLeft > 0) return;
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    // Cập nhật vị trí bát theo tay
    setBowlOffset({ x: deltaX, y: deltaY });

    // Kiểm tra lực kéo (khoảng cách từ tâm)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > threshold) {
      setIsDragging(false);
      // Hiệu ứng văng bát mạnh ra ngoài màn hình
      setBowlOffset({ x: deltaX * 8, y: deltaY * 8 });
      onOpenBowl();
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Nếu chưa đủ lực kéo, bát tự động đàn hồi về tâm (bát úp lại)
    const distance = Math.sqrt(bowlOffset.x ** 2 + bowlOffset.y ** 2);
    if (distance <= threshold) {
      setBowlOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div className="relative w-full max-w-lg aspect-square mx-auto flex flex-col items-center justify-center select-none perspective-container">
      {/* 3D Table Base */}
      <div className="absolute inset-0 rounded-full table-3d bg-gradient-to-b from-emerald-800 to-emerald-950 border-[16px] border-yellow-800 shadow-[0_50px_100px_rgba(0,0,0,0.9),inset_0_0_60px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
        <div className="absolute inset-4 rounded-full border-2 border-yellow-600/30"></div>
        <div className="absolute inset-12 rounded-full border border-white/5"></div>
      </div>

      {/* Thông báo trạng thái */}
      <div className="z-10 mb-12 flex flex-col items-center">
        {isRolling ? (
          <div className="text-yellow-400 font-black text-3xl animate-pulse tracking-widest text-gold drop-shadow-lg">ĐANG XÓC...</div>
        ) : timeLeft > 0 ? (
          <div className="flex flex-col items-center bg-black/70 px-10 py-4 rounded-3xl border border-yellow-500/30 backdrop-blur-md gold-glow">
            <span className="text-gray-400 text-[9px] uppercase font-black tracking-[0.4em] mb-1">Phiên đang mở</span>
            <span className={`text-7xl font-black casino-font ${timeLeft <= 5 ? 'text-red-500 animate-ping' : 'text-white'}`}>
              {timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
        ) : !isBowlOpened ? (
          <div className="flex flex-col items-center animate-bounce-slow">
             <div className="text-white font-black text-2xl bg-red-600 px-8 py-2 rounded-full uppercase shadow-2xl mb-4">NGỪNG CƯỢC</div>
             <div className="text-yellow-400 font-black text-lg bg-black/80 px-6 py-2 rounded-full border border-yellow-500/50">GIẬT BÁT ĐỂ XEM</div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
            <div className="text-white font-black text-8xl text-gold casino-font mb-2 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
               {dice.reduce((a, b) => a + b, 0)}
            </div>
            <div className={`text-5xl font-black px-12 py-3 rounded-2xl border-4 shadow-2xl ${dice.reduce((a, b) => a + b, 0) >= 11 ? 'bg-red-950 border-red-500 text-red-500' : 'bg-blue-950 border-blue-500 text-blue-500'}`}>
               {dice.reduce((a, b) => a + b, 0) >= 11 ? 'TÀI' : 'XỈU'}
            </div>
          </div>
        )}
      </div>

      {/* Dice Container */}
      <div className={`z-10 flex gap-4 transition-all duration-700 ${isRolling ? 'rotating scale-150 blur-[2px]' : 'scale-110'}`}>
        {dice.map((v, i) => (
          <div key={i} className="shadow-[0_15px_30px_rgba(0,0,0,0.6)] rounded-xl">
            <DiceIcon value={v} />
          </div>
        ))}
      </div>

      {/* Ceramic Bowl - Interactive Layer */}
      <div 
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchEnd={handleEnd}
        style={{ 
          transform: `translate(${bowlOffset.x}px, ${bowlOffset.y}px) ${isBowlOpened ? 'scale(1.2) rotate(30deg)' : ''}`,
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
          opacity: isBowlOpened && (Math.abs(bowlOffset.x) > 200 || Math.abs(bowlOffset.y) > 200) ? 0 : 1,
          cursor: isRolling || isBowlOpened || timeLeft > 0 ? 'default' : 'grab'
        }}
        className={`absolute z-20 w-[22rem] h-[22rem] rounded-full flex items-center justify-center 
          ${isRolling ? 'animate-shake' : ''}`}
      >
        <div className="relative w-full h-full rounded-full bg-zinc-50 shadow-[inset_0_-30px_80px_rgba(0,0,0,0.4),0_40px_60px_rgba(0,0,0,0.8)] border-[12px] border-zinc-200 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-[15px] border-blue-900/10 rounded-full flex items-center justify-center">
               <div className="text-blue-900/10 font-black text-4xl italic rotate-45 tracking-widest uppercase">Premium Casino</div>
            </div>
          </div>
          {/* Highlight shine */}
          <div className="absolute top-10 left-10 w-32 h-16 bg-white/70 blur-2xl rounded-full -rotate-45"></div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          25% { transform: translate(6px, 6px) rotate(1.5deg); }
          50% { transform: translate(-6px, -4px) rotate(-1.5deg); }
          75% { transform: translate(4px, -6px) rotate(1.5deg); }
        }
        .animate-shake { animation: shake 0.1s infinite; }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: float-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default DiceTable;
