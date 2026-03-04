import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { 
  ChevronLeft, TrendingUp, TrendingDown, Users, Activity, Settings, Zap, 
  Anchor, Play, Pause, Target, Bot, HelpCircle, X, Gift, Bell, CreditCard, 
  Check, Trash2, ShieldCheck, ShieldAlert, User, ArrowUp, ArrowDown, 
  Percent, Info, Send, Phone, Mail, Video, Trophy 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminPanelProps {
  socket: Socket | null;
  onBack: () => void;
  userEmail: string;
}

const AssetControl: React.FC<{ symbol: string, asset: any, socket: Socket | null }> = ({ symbol, asset, socket }) => {
  const [customPrice, setCustomPrice] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');

  const handleSetTrend = (trend: number) => {
    if (socket) socket.emit('admin-set-trend', { asset: symbol, trend });
  };

  const handleSetVolatility = (volatility: number) => {
    if (socket) socket.emit('admin-set-volatility', { asset: symbol, volatility });
  };

  const handleSetPrice = () => {
    if (socket && customPrice) {
      socket.emit('admin-set-price', { asset: symbol, price: parseFloat(customPrice) });
      setCustomPrice('');
    }
  };

  const handleSetTarget = () => {
    if (socket) {
      if (targetPrice) {
        socket.emit('admin-set-target', { asset: symbol, targetPrice: parseFloat(targetPrice) });
      } else {
        socket.emit('admin-set-target', { asset: symbol, targetPrice: null });
      }
    }
  };

  const handleToggleFreeze = () => {
    if (socket) socket.emit('admin-toggle-freeze', { asset: symbol, isFrozen: !asset.isFrozen });
  };

  const handlePumpDump = (multiplier: number) => {
    if (socket) {
      const amount = (asset.volatility || 0.001) * multiplier * 100;
      socket.emit('admin-pump-dump', { asset: symbol, amount });
    }
  };

  return (
    <div className="bg-[#1e222d] rounded-2xl border border-white/5 overflow-hidden shadow-xl hover:border-white/10 transition-colors">
      <div className="p-4 border-b border-white/5 bg-[#2a2e39]/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-white">{symbol}</div>
              <div className="flex gap-1 mt-0.5">
                {asset.isFrozen && <span className="bg-blue-500/20 text-blue-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">FROZEN</span>}
                {asset.targetPrice && <span className="bg-purple-500/20 text-purple-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">TARGET: {asset.targetPrice}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-black text-gray-300">{asset.price?.toFixed(5)}</div>
            <div className="text-[9px] text-gray-500 font-bold uppercase">Live Price</div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Trend Control */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Trend Control</label>
            <span className="text-[10px] font-mono text-blue-400">{asset.trend?.toFixed(6)}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => handleSetTrend((asset.trend || 0) + 0.001)} className="flex-1 bg-green-500/10 text-green-500 py-2 rounded-xl flex justify-center items-center hover:bg-green-500/20 transition active:scale-95 border border-green-500/10"><TrendingUp size={16} /></button>
            <button onClick={() => handleSetTrend(0)} className="px-4 bg-[#101114] text-gray-400 py-2 rounded-xl text-[10px] font-black uppercase hover:text-white transition active:scale-95 border border-white/5">Reset</button>
            <button onClick={() => handleSetTrend((asset.trend || 0) - 0.001)} className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-xl flex justify-center items-center hover:bg-red-500/20 transition active:scale-95 border border-red-500/10"><TrendingDown size={16} /></button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handlePumpDump(1)} className="bg-green-600/10 text-green-500 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-green-600/20 transition active:scale-95 border border-green-600/20"><Zap size={14} /> Pump</button>
          <button onClick={() => handlePumpDump(-1)} className="bg-red-600/10 text-red-500 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-red-600/20 transition active:scale-95 border border-red-600/20"><Zap size={14} /> Dump</button>
          <button onClick={handleToggleFreeze} className={`col-span-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition active:scale-95 ${asset.isFrozen ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20'}`}>
            {asset.isFrozen ? <Play size={14} /> : <Pause size={14} />} 
            {asset.isFrozen ? 'Unfreeze Market' : 'Freeze Market'}
          </button>
        </div>

        {/* Exact Price & Target */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input 
              type="number" 
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Set Price"
              className="w-full bg-[#101114] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition"
            />
            <button onClick={handleSetPrice} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-2 rounded-lg text-[10px] font-black uppercase hover:bg-blue-500 transition">Set</button>
          </div>
          <div className="relative">
            <input 
              type="number" 
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Target"
              className="w-full bg-[#101114] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition"
            />
            <button onClick={handleSetTarget} className="absolute right-1 top-1 bottom-1 bg-purple-600 text-white px-2 rounded-lg text-[10px] font-black uppercase hover:bg-purple-500 transition"><Target size={14} /></button>
          </div>
        </div>

        {/* Volatility */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Volatility</label>
            <span className="text-[10px] font-mono text-gray-400">{(asset.volatility * 100).toFixed(2)}%</span>
          </div>
          <input 
            type="range" 
            min="0.00001" 
            max="0.05" 
            step="0.0001"
            value={asset.volatility || 0}
            onChange={(e) => handleSetVolatility(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#101114] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ socket, onBack, userEmail }) => {
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assets, setAssets] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<'TRADES' | 'USERS' | 'MARKET' | 'AUTOMATION' | 'SUPPORT' | 'REQUESTS' | 'REFERRALS' | 'NOTIFICATIONS'>('TRADES');
  const [tradeSettings, setTradeSettings] = useState({ mode: 'FAIR', winPercentage: 50 });
  const [supportSettings, setSupportSettings] = useState({ telegram: '', whatsapp: '', email: '' });
  const [referralSettings, setReferralSettings] = useState({ bonusAmount: 10, referralPercentage: 5, minDepositForBonus: 20 });
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [newTutorial, setNewTutorial] = useState({ title: '', description: '', link: '', category: 'Beginner', duration: '' });
  const [newNotification, setNewNotification] = useState({ title: '', message: '', type: 'INFO' as 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' });

  useEffect(() => {
    if (!socket) return;

    socket.emit('admin-join', userEmail);

    socket.on('admin-active-trades', (trades) => {
      setActiveTrades(trades);
    });

    socket.on('admin-users', (connectedUsers) => {
      setUsers(connectedUsers);
    });

    socket.on('admin-assets', (initialAssets) => {
      setAssets(initialAssets);
    });

    socket.on('admin-trade-settings', (settings) => {
      setTradeSettings(settings);
    });

    socket.on('admin-support-settings', (settings) => {
      setSupportSettings(settings);
    });

    socket.on('admin-tutorials', (data) => {
      setTutorials(data);
    });

    socket.on('admin-referral-settings', (settings) => {
      setReferralSettings(settings);
    });

    socket.on('admin-requests', (data) => {
      setRequests(data);
    });

    socket.on('admin-notifications', (data) => {
      setNotifications(data);
    });

    socket.on('market-tick', (ticks) => {
      setAssets(prev => {
        const updated = { ...prev };
        Object.keys(ticks).forEach(symbol => {
          if (updated[symbol]) {
            updated[symbol] = { ...updated[symbol], ...ticks[symbol] };
          }
        });
        return updated;
      });
    });

    return () => {
      socket.off('admin-active-trades');
      socket.off('admin-users');
      socket.off('admin-assets');
      socket.off('admin-trade-settings');
      socket.off('admin-support-settings');
      socket.off('admin-tutorials');
      socket.off('admin-referral-settings');
      socket.off('admin-requests');
      socket.off('admin-notifications');
      socket.off('market-tick');
    };
  }, [socket, userEmail]);

  const handleUpdateSettings = (newSettings: any) => {
    if (socket) {
      socket.emit('admin-update-trade-settings', newSettings);
      setTradeSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const handleForceTrade = (tradeId: string, result: 'WIN' | 'LOSS') => {
    if (socket) {
      socket.emit('admin-force-trade', { tradeId, result });
    }
  };

  const handleSetTrend = (asset: string, trend: number) => {
    if (socket) {
      socket.emit('admin-set-trend', { asset, trend });
      setAssets(prev => ({ ...prev, [asset]: { ...prev[asset], trend } }));
    }
  };

  const handleSetVolatility = (asset: string, volatility: number) => {
    if (socket) {
      socket.emit('admin-set-volatility', { asset, volatility });
      setAssets(prev => ({ ...prev, [asset]: { ...prev[asset], volatility } }));
    }
  };

  const handleUpdateRequestStatus = (requestId: string, status: 'APPROVED' | 'REJECTED', message: string = '') => {
    if (socket) {
      socket.emit('admin-update-request-status', { requestId, status, message });
    }
  };

  const handleSendNotification = () => {
    if (socket && newNotification.title && newNotification.message) {
      socket.emit('admin-send-notification', newNotification);
      setNewNotification({ title: '', message: '', type: 'INFO' });
    }
  };

  const handleUpdateReferralSettings = (settings: any) => {
    if (socket) {
      socket.emit('admin-update-referral-settings', settings);
    }
  };

  const handleBoostUser = (email: string, isBoosted: boolean) => {
    if (socket) {
      socket.emit('admin-boost-user', { email, isBoosted });
    }
  };

  const adminEmails = ['hasan@gmail.com', 'tasmeaykhatun565@gmail.com'];
  if (!userEmail || !adminEmails.includes(userEmail.toLowerCase())) {
    return (
      <div className="min-h-screen bg-[#101114] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You do not have permission to view this page.</p>
          <button onClick={onBack} className="bg-[#2a2e39] px-6 py-2 rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101114] text-white font-sans flex flex-col">
      {/* Header */}
      <div className="bg-[#1e222d] border-b border-white/5 px-4 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-[#1e222d]/80">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-xl bg-[#2a2e39] flex items-center justify-center text-white hover:bg-[#353a47] transition-all active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-red-500">Admin Panel</h1>
            <div className="text-[10px] text-gray-500 font-bold">ONYX OPTION v2.4</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-gray-400">{userEmail}</span>
            <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">System Administrator</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Platform Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Activity size={14} />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Trades</span>
            </div>
            <div className="text-xl font-black text-white">{activeTrades.length}</div>
          </div>
          <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <Users size={14} />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-xl font-black text-white">{users.length}</div>
          </div>
          <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                <ArrowUp size={14} />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pending Req</span>
            </div>
            <div className="text-xl font-black text-white">{requests.filter(r => r.status === 'PENDING').length}</div>
          </div>
          <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Zap size={14} />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Boosted</span>
            </div>
            <div className="text-xl font-black text-white">{users.filter(u => u.isBoosted).length}</div>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex bg-[#1e222d] rounded-2xl p-1.5 mb-6 overflow-x-auto no-scrollbar shadow-inner border border-white/5">
          <div className="flex min-w-max gap-1">
          <button 
            onClick={() => setTab('TRADES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'TRADES' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Activity size={14} /> Trades
          </button>
          <button 
            onClick={() => setTab('USERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'USERS' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Users size={14} /> Users
          </button>
          <button 
            onClick={() => setTab('MARKET')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'MARKET' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Settings size={14} /> Market
          </button>
          <button 
            onClick={() => setTab('AUTOMATION')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'AUTOMATION' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Bot size={14} /> Auto
          </button>
          <button 
            onClick={() => setTab('REQUESTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'REQUESTS' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <CreditCard size={14} /> Requests
          </button>
          <button 
            onClick={() => setTab('SUPPORT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'SUPPORT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <HelpCircle size={14} /> Support
          </button>
          <button 
            onClick={() => setTab('REFERRALS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'REFERRALS' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Gift size={14} /> Referrals
          </button>
          <button 
            onClick={() => setTab('NOTIFICATIONS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tab === 'NOTIFICATIONS' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Bell size={14} /> Alerts
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'TRADES' && (
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Active Trades
              </h2>
              <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded-full border border-red-500/20">
                {activeTrades.length} ACTIVE
              </span>
            </div>
            
            {activeTrades.length === 0 ? (
              <div className="bg-[#1e222d] rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#2a2e39] rounded-full flex items-center justify-center mb-4 text-gray-500">
                  <Activity size={32} />
                </div>
                <h3 className="font-bold text-gray-300">No Active Trades</h3>
                <p className="text-xs text-gray-500 mt-1">Market is currently quiet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeTrades.map(trade => (
                  <div key={trade.id} className="bg-[#1e222d] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${trade.type === 'UP' ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}>
                            {trade.type === 'UP' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{trade.assetShortName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">ID: {trade.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-white">Đ{trade.amount}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Investment</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 bg-[#101114] p-3 rounded-xl border border-white/5">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Entry Price</div>
                          <div className="text-xs font-mono text-gray-300">{trade.entryPrice.toFixed(5)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Time Left</div>
                          <div className="text-xs font-mono text-blue-500 font-bold">
                            {Math.max(0, Math.ceil((trade.endTime - Date.now()) / 1000))}s
                          </div>
                        </div>
                      </div>

                      {trade.forcedResult && (
                        <div className={`mb-4 py-2 rounded-lg text-center text-[10px] font-black uppercase tracking-widest border ${trade.forcedResult === 'WIN' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          Auto-Control: {trade.forcedResult}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleForceTrade(trade.id, 'WIN')}
                          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 ${trade.forcedResult === 'WIN' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'}`}
                        >
                          FORCE WIN
                        </button>
                        <button 
                          onClick={() => handleForceTrade(trade.id, 'LOSS')}
                          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 ${trade.forcedResult === 'LOSS' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}`}
                        >
                          FORCE LOSS
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'USERS' && (
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">User Management</h2>
              <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded-full border border-blue-500/20">
                {users.length} REGISTERED
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {users.map(u => (
                <div key={u.id} className="bg-[#1e222d] rounded-2xl border border-white/5 p-4 flex items-center justify-between shadow-lg hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {u.name ? u.name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-200">{u.name || 'Anonymous'}</span>
                        {u.isBoosted && (
                          <div className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                            <Zap size={8} fill="currentColor" /> BOOSTED
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-black text-green-500">Đ{u.balance?.toLocaleString() || '0.00'}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{u.trades?.length || 0} Trades</div>
                    </div>
                    <div className="flex gap-1">
                       <button 
                        onClick={() => handleBoostUser(u.email, !u.isBoosted)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${u.isBoosted ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-[#2a2e39] text-gray-400 hover:text-gray-200'}`}
                        title={u.isBoosted ? "Remove Boost" : "Apply Boost"}
                      >
                        <Zap size={18} fill={u.isBoosted ? "currentColor" : "none"} />
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-[#2a2e39] text-gray-400 flex items-center justify-center hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'MARKET' && (
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Market Manipulation</h2>
              <div className="flex gap-2">
                <button className="bg-[#2a2e39] text-gray-400 p-2 rounded-xl hover:text-white transition">
                  <Activity size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(assets).map(symbol => (
                <AssetControl key={symbol} symbol={symbol} asset={assets[symbol]} socket={socket} />
              ))}
            </div>
          </div>
        )}

        {tab === 'AUTOMATION' && (
          <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Trade Automation</h2>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                <Bot size={20} />
              </div>
            </div>
            
            <div className="bg-[#1e222d] p-6 rounded-2xl border border-white/5 shadow-xl">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6">Global Trade Result Mode</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <button 
                  onClick={() => handleUpdateSettings({ mode: 'FAIR' })}
                  className={`group relative py-4 rounded-2xl font-black text-xs border transition-all active:scale-95 flex flex-col items-center gap-2 ${tradeSettings.mode === 'FAIR' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-[#101114] border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Activity size={20} />
                  FAIR MARKET
                  {tradeSettings.mode === 'FAIR' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-blue-600 rounded-full flex items-center justify-center border-2 border-blue-600"><Check size={10} strokeWidth={4} /></div>}
                </button>
                <button 
                  onClick={() => handleUpdateSettings({ mode: 'FORCE_LOSS' })}
                  className={`group relative py-4 rounded-2xl font-black text-xs border transition-all active:scale-95 flex flex-col items-center gap-2 ${tradeSettings.mode === 'FORCE_LOSS' ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' : 'bg-[#101114] border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <TrendingDown size={20} />
                  FORCE ALL LOSS
                  {tradeSettings.mode === 'FORCE_LOSS' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-red-600 rounded-full flex items-center justify-center border-2 border-red-600"><Check size={10} strokeWidth={4} /></div>}
                </button>
                <button 
                  onClick={() => handleUpdateSettings({ mode: 'FORCE_WIN' })}
                  className={`group relative py-4 rounded-2xl font-black text-xs border transition-all active:scale-95 flex flex-col items-center gap-2 ${tradeSettings.mode === 'FORCE_WIN' ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20' : 'bg-[#101114] border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <TrendingUp size={20} />
                  FORCE ALL WIN
                  {tradeSettings.mode === 'FORCE_WIN' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-green-600 rounded-full flex items-center justify-center border-2 border-green-600"><Check size={10} strokeWidth={4} /></div>}
                </button>
                <button 
                  onClick={() => handleUpdateSettings({ mode: 'PERCENTAGE' })}
                  className={`group relative py-4 rounded-2xl font-black text-xs border transition-all active:scale-95 flex flex-col items-center gap-2 ${tradeSettings.mode === 'PERCENTAGE' ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-[#101114] border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Percent size={20} />
                  WIN PERCENTAGE
                  {tradeSettings.mode === 'PERCENTAGE' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-purple-600 rounded-full flex items-center justify-center border-2 border-purple-600"><Check size={10} strokeWidth={4} /></div>}
                </button>
              </div>

              {tradeSettings.mode === 'PERCENTAGE' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#101114] p-6 rounded-2xl border border-white/5 shadow-inner"
                >
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">User Win Probability</label>
                    <span className="text-2xl font-black text-purple-500">{tradeSettings.winPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={tradeSettings.winPercentage}
                    onChange={(e) => handleUpdateSettings({ winPercentage: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#1e222d] rounded-lg appearance-none cursor-pointer accent-purple-500 mb-4"
                  />
                  <div className="flex items-center gap-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                    <Info size={16} className="text-purple-500 shrink-0" />
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      If set to <span className="text-purple-400 font-bold">{tradeSettings.winPercentage}%</span>, users will win approximately {tradeSettings.winPercentage} out of every 100 trades. The system will automatically adjust market movement to ensure this outcome.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {tab === 'SUPPORT' && (
          <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Support & Education</h2>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                <HelpCircle size={20} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Support Links */}
              <div className="bg-[#1e222d] p-6 rounded-3xl border border-white/5 shadow-xl space-y-6">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-500">Support Channels</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Telegram Link</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Send size={16} /></div>
                      <input 
                        type="text" 
                        value={supportSettings.telegram}
                        onChange={(e) => setSupportSettings(prev => ({ ...prev, telegram: e.target.value }))}
                        className="w-full bg-[#101114] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition shadow-inner"
                        placeholder="https://t.me/your_support"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">WhatsApp Link</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400"><Phone size={16} /></div>
                      <input 
                        type="text" 
                        value={supportSettings.whatsapp}
                        onChange={(e) => setSupportSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full bg-[#101114] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition shadow-inner"
                        placeholder="https://wa.me/1234567890"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Support Email</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400"><Mail size={16} /></div>
                      <input 
                        type="email" 
                        value={supportSettings.email}
                        onChange={(e) => setSupportSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-[#101114] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition shadow-inner"
                        placeholder="support@yourdomain.com"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => socket?.emit('admin-update-support-settings', supportSettings)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 mt-2 text-xs uppercase tracking-widest"
                  >
                    Update Channels
                  </button>
                </div>
              </div>

              {/* YouTube Tutorials */}
              <div className="bg-[#1e222d] p-6 rounded-3xl border border-white/5 shadow-xl space-y-6">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-red-500">YouTube Tutorials</h3>
                
                <div className="bg-[#101114] p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text" 
                      placeholder="Video Title"
                      value={newTutorial.title}
                      onChange={(e) => setNewTutorial(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-[#1e222d] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition"
                    />
                    <textarea 
                      placeholder="Short Description"
                      value={newTutorial.description}
                      onChange={(e) => setNewTutorial(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-[#1e222d] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none h-20 focus:border-red-500/50 transition resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="YouTube URL"
                        value={newTutorial.link}
                        onChange={(e) => setNewTutorial(prev => ({ ...prev, link: e.target.value }))}
                        className="w-full bg-[#1e222d] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition"
                      />
                      <input 
                        type="text" 
                        placeholder="Duration"
                        value={newTutorial.duration}
                        onChange={(e) => setNewTutorial(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full bg-[#1e222d] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition"
                      />
                    </div>
                    <select 
                      value={newTutorial.category}
                      onChange={(e) => setNewTutorial(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-[#1e222d] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      if (!newTutorial.title || !newTutorial.link) return;
                      const updated = [...tutorials, { ...newTutorial, id: Date.now().toString() }];
                      setTutorials(updated);
                      socket?.emit('admin-update-tutorials', updated);
                      setNewTutorial({ title: '', description: '', link: '', category: 'Beginner', duration: '' });
                    }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 text-xs uppercase tracking-widest"
                  >
                    Add Tutorial
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {tutorials.map((t, idx) => (
                    <div key={t.id} className="bg-[#101114] p-4 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:border-red-500/20 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <Video size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-200">{t.title}</div>
                            <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t.category} • {t.duration}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = tutorials.filter((_, i) => i !== idx);
                            setTutorials(updated);
                            socket?.emit('admin-update-tutorials', updated);
                          }}
                          className="text-gray-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 ml-1">{t.description}</p>
                      <div className="text-[9px] text-blue-400 truncate ml-1 font-mono">{t.link}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'REQUESTS' && (
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Transaction Requests</h2>
              <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black px-2 py-1 rounded-full border border-orange-500/20">
                {requests.filter(r => r.status === 'PENDING').length} PENDING
              </span>
            </div>
            
            {requests.length === 0 ? (
              <div className="bg-[#1e222d] rounded-3xl border border-white/5 p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#2a2e39] rounded-full flex items-center justify-center mb-6 text-gray-600">
                  <CreditCard size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-300">No Requests Found</h3>
                <p className="text-sm text-gray-500 mt-2">All transactions have been processed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.slice().reverse().map(req => (
                  <div key={req.id} className="bg-[#1e222d] rounded-3xl border border-white/5 overflow-hidden shadow-xl flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${req.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {req.type === 'DEPOSIT' ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${req.type === 'DEPOSIT' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {req.type}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {req.status}
                              </span>
                            </div>
                            <div className="text-xl font-black text-white mt-1">Đ{req.amount.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 font-bold">{new Date(req.timestamp).toLocaleDateString()}</div>
                          <div className="text-[10px] text-gray-600 font-mono">{new Date(req.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      
                      <div className="bg-[#101114] p-4 rounded-2xl border border-white/5 space-y-2 mb-4 shadow-inner">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-bold uppercase tracking-tighter">User</span>
                          <span className="text-gray-300 font-medium">{req.userEmail}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-bold uppercase tracking-tighter">Method</span>
                          <span className="text-blue-400 font-black">{req.method}</span>
                        </div>
                        {req.details && (
                          <div className="pt-2 border-t border-white/5">
                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Details / Transaction ID</div>
                            <div className="text-xs text-gray-300 break-all font-mono bg-[#1e222d] p-2 rounded-lg">{req.details}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="p-4 bg-[#101114]/50 border-t border-white/5 flex gap-2">
                        <button 
                          onClick={() => handleUpdateRequestStatus(req.id, 'APPROVED')}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Check size={16} strokeWidth={3} /> Approve
                        </button>
                        <button 
                          onClick={() => {
                            const msg = prompt('Reason for rejection?');
                            if (msg !== null) handleUpdateRequestStatus(req.id, 'REJECTED', msg);
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <X size={16} strokeWidth={3} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'REFERRALS' && (
          <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Referral Program</h2>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
                <Gift size={20} />
              </div>
            </div>
            
            <div className="bg-[#1e222d] p-8 rounded-3xl border border-white/5 shadow-2xl max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-4 shadow-inner">
                  <Trophy size={40} />
                </div>
                <h3 className="text-xl font-black text-white">Reward Configuration</h3>
                <p className="text-sm text-gray-500 mt-2">Configure how users are rewarded for inviting others.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fixed Bonus (Đ)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-black">Đ</div>
                    <input 
                      type="number" 
                      value={referralSettings.bonusAmount}
                      onChange={(e) => setReferralSettings(prev => ({ ...prev, bonusAmount: parseFloat(e.target.value) }))}
                      className="w-full bg-[#101114] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-lg font-black text-white outline-none focus:border-yellow-500 transition shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Commission (%)</label>
                  <div className="relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500 font-black">%</div>
                    <input 
                      type="number" 
                      value={referralSettings.referralPercentage}
                      onChange={(e) => setReferralSettings(prev => ({ ...prev, referralPercentage: parseFloat(e.target.value) }))}
                      className="w-full bg-[#101114] border border-white/5 rounded-2xl px-4 py-4 text-lg font-black text-white outline-none focus:border-yellow-500 transition shadow-inner"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Minimum Deposit Required (Đ)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black"><Target size={18} /></div>
                    <input 
                      type="number" 
                      value={referralSettings.minDepositForBonus}
                      onChange={(e) => setReferralSettings(prev => ({ ...prev, minDepositForBonus: parseFloat(e.target.value) }))}
                      className="w-full bg-[#101114] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-lg font-black text-white outline-none focus:border-yellow-500 transition shadow-inner"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleUpdateReferralSettings(referralSettings)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 text-sm uppercase tracking-[0.2em]"
              >
                Update Referral Policy
              </button>
            </div>
          </div>
        )}

        {tab === 'NOTIFICATIONS' && (
          <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">System Alerts</h2>
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                <Bell size={20} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1e222d] p-8 rounded-3xl border border-white/5 shadow-xl space-y-6">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Broadcast New Alert</h3>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Alert Headline"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#101114] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500 transition shadow-inner"
                  />
                  <textarea 
                    placeholder="Detailed message for all users..."
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-[#101114] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none h-32 resize-none focus:border-blue-500 transition shadow-inner"
                  />
                  <div className="flex gap-2">
                    {(['INFO', 'SUCCESS', 'WARNING', 'DANGER'] as const).map(type => (
                      <button 
                        key={type}
                        onClick={() => setNewNotification(prev => ({ ...prev, type }))}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all border uppercase tracking-widest ${newNotification.type === type ? 'bg-white text-black border-white shadow-lg' : 'bg-[#101114] text-gray-500 border-white/5 hover:border-white/20'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleSendNotification}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 mt-2 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                  >
                    <Send size={18} /> Broadcast to All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 ml-2">Broadcast History</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="bg-[#1e222d] rounded-3xl border border-white/5 p-12 text-center">
                      <p className="text-gray-500 text-sm font-bold">No history available.</p>
                    </div>
                  ) : (
                    notifications.slice().reverse().map(n => (
                      <div key={n.id} className="bg-[#1e222d] p-5 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${n.type === 'DANGER' ? 'bg-red-500' : n.type === 'WARNING' ? 'bg-yellow-500' : n.type === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            <span className="font-black text-sm text-gray-200">{n.title}</span>
                          </div>
                          <span className="text-[9px] text-gray-600 font-bold">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${n.type === 'DANGER' ? 'bg-red-500/10 text-red-500' : n.type === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500' : n.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {n.type}
                          </span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase">{new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
