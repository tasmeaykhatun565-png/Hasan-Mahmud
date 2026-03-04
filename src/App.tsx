import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { AdminPanel } from './components/AdminPanel';
import { 
  ArrowUp, ArrowDown, Wallet, History, Settings, Bell, Menu, X, 
  User, ChevronDown, ChevronUp, Signal, Compass, BarChart2, HelpCircle, 
  Briefcase, Gift, LayoutGrid, Plus, Minus, Divide, Clock, Percent,
  ChevronLeft, Copy, Box, Link as LinkIcon, CalendarDays, ChevronRight,
  Shuffle, Target, ChevronsUp, GraduationCap, MessageCircle, BookOpen,
  Trophy, ShoppingBag, ArrowUpDown, Mail, UserCheck, Key, Shield, ShieldCheck, Zap, Check, Grid, Image, Activity, LogOut,
  Search, Info, AlignLeft, Star, MoreVertical, Lock, Video, FileText, Phone, Youtube, Globe, Send, Bitcoin, Gem, TrendingUp
} from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import SupportChat from './components/SupportChat';
import PaymentsSheet from './components/PaymentsSheet';
import ChartSettingsSheet from './components/ChartSettingsSheet';
import AccountsSheet from './components/AccountsSheet';
import TradeInputSheet from './components/TradeInputSheet';
import RiskManagementSheet from './components/RiskManagementSheet';
import { TradingChart } from './components/TradingChart';
import Auth from './components/Auth';
import { TradingPlatformSettings, AppearanceSettings, NotificationSettings } from './components/SettingsSubPages';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import HomePage from './components/HomePage';

import { io, Socket } from 'socket.io-client';

import { useTranslation } from './lib/i18n';

// --- Types ---
type OHLCData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  formattedTime: string;
};

type TickData = {
  time: number;
  price: number;
};

type Trade = {
  id: string;
  type: 'UP' | 'DOWN';
  entryPrice: number;
  closePrice?: number;
  amount: number;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS';
  payout: number;
  profit?: number;
  asset: string;
  assetShortName: string;
  assetFlag: string;
  assetCategory: 'Crypto' | 'Forex' | 'Stocks' | 'Commodities';
};

type TradeResult = {
  id: string;
  profit: number;
  isWin: boolean;
};

type Asset = {
  id: string;
  name: string;
  shortName: string;
  payout: number;
  category: 'Crypto' | 'Forex' | 'Stocks' | 'Commodities';
  flag: string; // Emoji or Icon representation
  basePrice: number;
  volatility: number;
  isFrozen?: boolean;
};

// --- Constants ---
const ASSETS: Asset[] = [
  { id: 'aud_chf', name: 'AUD/CHF (OTC)', shortName: 'AUD/CHF', payout: 92, category: 'Forex', flag: '🇦🇺🇨🇭', basePrice: 0.5720, volatility: 0.0002 },
  { id: 'aud_jpy', name: 'AUD/JPY (OTC)', shortName: 'AUD/JPY', payout: 92, category: 'Forex', flag: '🇦🇺🇯🇵', basePrice: 97.50, volatility: 0.02 },
  { id: 'aud_usd', name: 'AUD/USD (OTC)', shortName: 'AUD/USD', payout: 90, category: 'Forex', flag: '🇦🇺🇺🇸', basePrice: 0.6550, volatility: 0.0002 },
  { id: 'eur_aud', name: 'EUR/AUD (OTC)', shortName: 'EUR/AUD', payout: 91, category: 'Forex', flag: '🇪🇺🇦🇺', basePrice: 1.6550, volatility: 0.0002 },
  { id: 'eur_cad', name: 'EUR/CAD (OTC)', shortName: 'EUR/CAD', payout: 92, category: 'Forex', flag: '🇪🇺🇨🇦', basePrice: 1.4650, volatility: 0.0002 },
  { id: 'eur_gbp', name: 'EUR/GBP (OTC)', shortName: 'EUR/GBP', payout: 90, category: 'Forex', flag: '🇪🇺🇬🇧', basePrice: 0.8550, volatility: 0.0002 },
  { id: 'eur_jpy', name: 'EUR/JPY (OTC)', shortName: 'EUR/JPY', payout: 91, category: 'Forex', flag: '🇪🇺🇯🇵', basePrice: 163.50, volatility: 0.02 },
  { id: 'eur_usd', name: 'EUR/USD (OTC)', shortName: 'EUR/USD', payout: 92, category: 'Forex', flag: '🇪🇺🇺🇸', basePrice: 1.0845, volatility: 0.0002 },
  { id: 'gbp_aud', name: 'GBP/AUD (OTC)', shortName: 'GBP/AUD', payout: 92, category: 'Forex', flag: '🇬🇧🇦🇺', basePrice: 1.9350, volatility: 0.0003 },
  { id: 'gbp_cad', name: 'GBP/CAD (OTC)', shortName: 'GBP/CAD', payout: 92, category: 'Forex', flag: '🇬🇧🇨🇦', basePrice: 1.7150, volatility: 0.0003 },
  { id: 'gbp_chf', name: 'GBP/CHF (OTC)', shortName: 'GBP/CHF', payout: 92, category: 'Forex', flag: '🇬🇧🇨🇭', basePrice: 1.1350, volatility: 0.0003 },
  { id: 'gbp_usd', name: 'GBP/USD (OTC)', shortName: 'GBP/USD', payout: 92, category: 'Forex', flag: '🇬🇧🇺🇸', basePrice: 1.2670, volatility: 0.0003 },
  { id: 'nzd_usd', name: 'NZD/USD (OTC)', shortName: 'NZD/USD', payout: 91, category: 'Forex', flag: '🇳🇿🇺🇸', basePrice: 0.6150, volatility: 0.0002 },
  { id: 'usd_aed', name: 'USD/AED (OTC)', shortName: 'USD/AED', payout: 91, category: 'Forex', flag: '🇺🇸🇦🇪', basePrice: 3.67, volatility: 0.001 },
  { id: 'usd_ars', name: 'USD/ARS (OTC)', shortName: 'USD/ARS', payout: 92, category: 'Forex', flag: '🇺🇸🇦🇷', basePrice: 830.50, volatility: 1.5 },
  { id: 'usd_bdt', name: 'USD/BDT (OTC)', shortName: 'USD/BDT', payout: 91, category: 'Forex', flag: '🇺🇸🇧🇩', basePrice: 109.50, volatility: 0.5 },
  { id: 'usd_brl', name: 'USD/BRL (OTC)', shortName: 'USD/BRL', payout: 91, category: 'Forex', flag: '🇺🇸🇧🇷', basePrice: 4.95, volatility: 0.01 },
  { id: 'usd_cad', name: 'USD/CAD (OTC)', shortName: 'USD/CAD', payout: 91, category: 'Forex', flag: '🇺🇸🇨🇦', basePrice: 1.3550, volatility: 0.0002 },
  { id: 'usd_chf', name: 'USD/CHF (OTC)', shortName: 'USD/CHF', payout: 92, category: 'Forex', flag: '🇺🇸🇨🇭', basePrice: 0.8850, volatility: 0.0002 },
  { id: 'usd_cop', name: 'USD/COP (OTC)', shortName: 'USD/COP', payout: 92, category: 'Forex', flag: '🇺🇸🇨🇴', basePrice: 3950.50, volatility: 5.0 },
  { id: 'usd_dzd', name: 'USD/DZD (OTC)', shortName: 'USD/DZD', payout: 91, category: 'Forex', flag: '🇺🇸🇩🇿', basePrice: 134.50, volatility: 0.5 },
  { id: 'usd_egp', name: 'USD/EGP (OTC)', shortName: 'USD/EGP', payout: 92, category: 'Forex', flag: '🇺🇸🇪🇬', basePrice: 30.90, volatility: 0.1 },
  { id: 'usd_idr', name: 'USD/IDR (OTC)', shortName: 'USD/IDR', payout: 93, category: 'Forex', flag: '🇺🇸🇮🇩', basePrice: 15600.0, volatility: 20.0 },
  { id: 'usd_inr', name: 'USD/INR (OTC)', shortName: 'USD/INR', payout: 92, category: 'Forex', flag: '🇺🇸🇮🇳', basePrice: 83.00, volatility: 0.1 },
  { id: 'usd_mxn', name: 'USD/MXN (OTC)', shortName: 'USD/MXN', payout: 92, category: 'Forex', flag: '🇺🇸🇲🇽', basePrice: 17.05, volatility: 0.05 },
  { id: 'usd_pkr', name: 'USD/PKR (OTC)', shortName: 'USD/PKR', payout: 91, category: 'Forex', flag: '🇺🇸🇵🇰', basePrice: 279.50, volatility: 1.0 },
  { id: 'usd_sar', name: 'USD/SAR (OTC)', shortName: 'USD/SAR', payout: 92, category: 'Forex', flag: '🇺🇸🇸🇦', basePrice: 3.75, volatility: 0.001 },
  { id: 'usd_try', name: 'USD/TRY (OTC)', shortName: 'USD/TRY', payout: 92, category: 'Forex', flag: '🇺🇸🇹🇷', basePrice: 31.20, volatility: 0.05 },
  { id: 'usd_zar', name: 'USD/ZAR (OTC)', shortName: 'USD/ZAR', payout: 91, category: 'Forex', flag: '🇺🇸🇿🇦', basePrice: 19.10, volatility: 0.02 },
  { id: 'btc_usd', name: 'Bitcoin (OTC)', shortName: 'BTC/USD', payout: 90, category: 'Crypto', flag: '₿', basePrice: 51241.67, volatility: 15.5 },
  { id: 'eth_usd', name: 'Ethereum (OTC)', shortName: 'ETH/USD', payout: 90, category: 'Crypto', flag: 'Ξ', basePrice: 2950.12, volatility: 2.5 },
  { id: 'sol_usd', name: 'Solana (OTC)', shortName: 'SOL/USD', payout: 88, category: 'Crypto', flag: '◎', basePrice: 105.45, volatility: 0.8 },
  { id: 'xrp_usd', name: 'Ripple (OTC)', shortName: 'XRP/USD', payout: 88, category: 'Crypto', flag: '✕', basePrice: 0.54, volatility: 0.005 },
  { id: 'gold_usd', name: 'Gold (OTC)', shortName: 'GOLD', payout: 92, category: 'Commodities', flag: '🟡', basePrice: 2035.50, volatility: 0.5 },
  { id: 'silver_usd', name: 'Silver (OTC)', shortName: 'SILVER', payout: 90, category: 'Commodities', flag: '⚪', basePrice: 22.80, volatility: 0.05 },
  { id: 'oil_usd', name: 'Crude Oil (OTC)', shortName: 'OIL', payout: 89, category: 'Commodities', flag: '🛢️', basePrice: 78.40, volatility: 0.2 },
  { id: 'aapl_usd', name: 'Apple (OTC)', shortName: 'AAPL', payout: 92, category: 'Stocks', flag: '🍎', basePrice: 182.30, volatility: 0.5 },
  { id: 'googl_usd', name: 'Google (OTC)', shortName: 'GOOGL', payout: 92, category: 'Stocks', flag: '🔍', basePrice: 145.60, volatility: 0.4 },
  { id: 'tsla_usd', name: 'Tesla (OTC)', shortName: 'TSLA', payout: 91, category: 'Stocks', flag: '⚡', basePrice: 195.20, volatility: 1.2 },
  { id: 'amzn_usd', name: 'Amazon (OTC)', shortName: 'AMZN', payout: 91, category: 'Stocks', flag: '📦', basePrice: 175.40, volatility: 0.6 },
  { id: 'msft_usd', name: 'Microsoft (OTC)', shortName: 'MSFT', payout: 92, category: 'Stocks', flag: '💻', basePrice: 410.50, volatility: 0.8 },
  { id: 'meta_usd', name: 'Meta (OTC)', shortName: 'META', payout: 92, category: 'Stocks', flag: '♾️', basePrice: 485.20, volatility: 1.5 },
  { id: 'nflx_usd', name: 'Netflix (OTC)', shortName: 'NFLX', payout: 91, category: 'Stocks', flag: '🎬', basePrice: 590.40, volatility: 1.0 },
  { id: 'nvda_usd', name: 'Nvidia (OTC)', shortName: 'NVDA', payout: 93, category: 'Stocks', flag: '🎮', basePrice: 785.30, volatility: 2.5 },
  { id: 'baba_usd', name: 'Alibaba (OTC)', shortName: 'BABA', payout: 89, category: 'Stocks', flag: '🇨🇳', basePrice: 75.20, volatility: 0.8 },
  { id: 'doge_usd', name: 'Dogecoin (OTC)', shortName: 'DOGE/USD', payout: 85, category: 'Crypto', flag: '🐕', basePrice: 0.085, volatility: 0.002 },
  { id: 'ada_usd', name: 'Cardano (OTC)', shortName: 'ADA/USD', payout: 87, category: 'Crypto', flag: '₳', basePrice: 0.58, volatility: 0.01 },
  { id: 'dot_usd', name: 'Polkadot (OTC)', shortName: 'DOT/USD', payout: 87, category: 'Crypto', flag: '●', basePrice: 7.45, volatility: 0.15 },
  { id: 'copper_usd', name: 'Copper (OTC)', shortName: 'COPPER', payout: 88, category: 'Commodities', flag: '🥉', basePrice: 3.85, volatility: 0.02 },
  { id: 'gas_usd', name: 'Natural Gas (OTC)', shortName: 'NATGAS', payout: 88, category: 'Commodities', flag: '🔥', basePrice: 1.85, volatility: 0.05 },
  { id: 'corn_usd', name: 'Corn (OTC)', shortName: 'CORN', payout: 85, category: 'Commodities', flag: '🌽', basePrice: 4.50, volatility: 0.02 },
  { id: 'wheat_usd', name: 'Wheat (OTC)', shortName: 'WHEAT', payout: 85, category: 'Commodities', flag: '🌾', basePrice: 5.80, volatility: 0.03 },
  { id: 'link_usd', name: 'Chainlink (OTC)', shortName: 'LINK/USD', payout: 88, category: 'Crypto', flag: '🔗', basePrice: 18.50, volatility: 0.2 },
  { id: 'matic_usd', name: 'Polygon (OTC)', shortName: 'MATIC/USD', payout: 88, category: 'Crypto', flag: '🟣', basePrice: 0.95, volatility: 0.01 },
  { id: 'uni_usd', name: 'Uniswap (OTC)', shortName: 'UNI/USD', payout: 87, category: 'Crypto', flag: '🦄', basePrice: 7.20, volatility: 0.1 },
  { id: 'dis_usd', name: 'Disney (OTC)', shortName: 'DIS', payout: 90, category: 'Stocks', flag: '🏰', basePrice: 110.50, volatility: 0.4 },
  { id: 'pypl_usd', name: 'PayPal (OTC)', shortName: 'PYPL', payout: 90, category: 'Stocks', flag: '💳', basePrice: 60.20, volatility: 0.5 },
  { id: 'nke_usd', name: 'Nike (OTC)', shortName: 'NKE', payout: 90, category: 'Stocks', flag: '👟', basePrice: 105.40, volatility: 0.3 },
];

const INITIAL_BALANCE = 12273.67;

// --- Helper Functions ---
const getTimeFrameInMs = (tf: string): number => {
  const value = parseInt(tf);
  const unit = tf.replace(String(value), '');
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60000;
  }
};

// --- Helper Components ---
const AssetIcon = ({ 
  shortName, 
  category, 
  flag, 
  size = "md" 
}: { 
  shortName: string, 
  category?: string, 
  flag?: string, 
  size?: "sm" | "md" | "lg" 
}) => {
  const containerSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  const flagSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  const fontSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-2xl" : "text-lg";

  if (category === 'Forex') {
    const currencies = shortName.split('/');
    if (currencies.length === 2) {
      const c1 = currencies[0].toLowerCase();
      const c2 = currencies[1].toLowerCase();
      
      const countryMap: Record<string, string> = {
        aud: 'au', chf: 'ch', jpy: 'jp', usd: 'us', eur: 'eu',
        cad: 'ca', gbp: 'gb', nzd: 'nz', aed: 'ae', ars: 'ar',
        bd: 'bd', bdt: 'bd', brl: 'br', cop: 'co', dzd: 'dz',
        egp: 'eg', idr: 'id', inr: 'in', mxn: 'mx', pkr: 'pk',
        sar: 'sa', try: 'tr', zar: 'za'
      };

      const code1 = countryMap[c1] || c1.substring(0, 2);
      const code2 = countryMap[c2] || c2.substring(0, 2);

      return (
        <div className={cn("relative flex items-center justify-center", containerSize)}>
          <div className={cn("absolute left-0 top-0 rounded-full border-2 border-[#101114] overflow-hidden z-10 shadow-md", flagSize)}>
            <img 
              src={`https://flagcdn.com/w80/${code1}.png`} 
              alt={c1} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className={cn("absolute right-0 bottom-0 rounded-full border-2 border-[#101114] overflow-hidden z-20 shadow-md", flagSize)}>
            <img 
              src={`https://flagcdn.com/w80/${code2}.png`} 
              alt={c2} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }
  }
  
  return (
    <div className={cn("rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-color)] shadow-sm", containerSize, fontSize)}>
      {flag}
    </div>
  );
};

// --- Asset Selector Component ---
function AssetSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentAssetId,
  marketAssets
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (asset: Asset) => void;
  currentAssetId: string;
  marketAssets: Record<string, any>;
}) {
  const [activeTab, setActiveTab] = useState('Fixed Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Forex': true,
    'Crypto': true,
    'Stocks': true,
    'Commodities': true
  });

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const filteredAssets = ASSETS.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {
      'Forex': [],
      'Crypto': [],
      'Stocks': [],
      'Commodities': []
    };
    filteredAssets.forEach(asset => {
      if (groups[asset.category]) {
        groups[asset.category].push(asset);
      }
    });
    return groups;
  }, [filteredAssets]);

  const categoryIcons: Record<string, React.ReactNode> = {
    'Forex': <Globe size={18} className="text-blue-400" />,
    'Crypto': <Bitcoin size={18} className="text-orange-400" />,
    'Stocks': <TrendingUp size={18} className="text-green-400" />,
    'Commodities': <Gem size={18} className="text-yellow-400" />
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-[#101114] font-sans flex flex-col">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-white/5">
         <h2 className="text-xl font-bold text-white">Select an asset</h2>
         <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/10">
            <X size={24} />
         </button>
       </div>

       {/* Search */}
       <div className="px-4 py-3">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search by name or ticker" 
                className="w-full bg-[#1e222d] text-white pl-10 pr-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
       </div>

       {/* Tabs */}
       <div className="flex items-center px-4 gap-2 mb-2 overflow-x-auto scrollbar-hide">
          {['Favorites', 'Fixed Time', '5s Scalping'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition",
                    activeTab === tab 
                        ? "bg-[#3b82f6] text-white" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab}
              </button>
          ))}
       </div>

       {/* List Header */}
       <div className="flex-1 overflow-y-auto pb-20">
          {(Object.entries(groupedAssets) as [string, Asset[]][]).map(([category, assets]) => (
            <div key={category} className="mb-2">
              {assets.length > 0 && (
                <>
                  <button 
                      onClick={() => toggleSection(category)}
                      className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-white/5 transition border-b border-white/5"
                  >
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            {categoryIcons[category]}
                          </div>
                          <span className="font-bold text-white">{category}</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{assets.length}</span>
                      </div>
                      {openSections[category] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {openSections[category] && (
                      <div className="divide-y divide-white/5">
                          {assets.map(asset => {
                              const dynamicAsset = marketAssets[asset.shortName];
                              const isFrozen = dynamicAsset?.isFrozen;
                              
                              return (
                                  <div 
                                      key={asset.id}
                                      onClick={() => {
                                          if (isFrozen) return;
                                          onSelect(asset);
                                          onClose();
                                      }}
                                      className={cn(
                                          "flex items-center justify-between px-4 py-4 hover:bg-white/5 cursor-pointer transition",
                                          asset.id === currentAssetId && "bg-white/5",
                                          isFrozen && "opacity-50 cursor-not-allowed"
                                      )}
                                  >
                                      <div className="flex items-center">
                                          <div className="mr-3 relative">
                                              <AssetIcon 
                                                  shortName={asset.shortName} 
                                                  category={asset.category} 
                                                  flag={asset.flag} 
                                              />
                                              {isFrozen && (
                                                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-[#101114]">
                                                      <Lock size={8} className="text-white" />
                                                  </div>
                                              )}
                                          </div>
                                          <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                <span className="text-white font-bold text-sm">{asset.name.split('(')[0].trim()}</span>
                                                <span className="text-[10px] text-gray-500 font-medium">OTC</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {isFrozen ? (
                                                  <span className="text-[10px] text-red-500 font-bold uppercase">Closed</span>
                                                ) : (
                                                  <span className="text-[10px] text-gray-500 font-mono">Market Open</span>
                                                )}
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                          {isFrozen ? (
                                              <Lock size={16} className="text-gray-500" />
                                          ) : (
                                              <div className="flex flex-col items-end">
                                                <span className="text-[#3b82f6] text-sm font-black">
                                                    {asset.payout}%
                                                </span>
                                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Profit</span>
                                              </div>
                                          )}
                                          <button className="text-gray-600 hover:text-white p-1">
                                             <Star size={16} />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
                </>
              )}
            </div>
          ))}
       </div>
    </div>
  );
}

// --- Main Component ---
function SettingsPage({ 
  onBack, 
  onLogout, 
  timezoneOffset, 
  setTimezoneOffset 
}: { 
  onBack: () => void, 
  onLogout: () => void, 
  timezoneOffset: number, 
  setTimezoneOffset: (v: number) => void 
}) {
  const { t } = useTranslation();
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#101114] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/5">
        <button onClick={onBack} className="text-white hover:bg-white/10 p-1 rounded-full transition">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* PROFILE */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('settings.profile')}</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <SettingsItem icon={<User size={20} />} label="Personal Information" />
            <SettingsItem icon={<Mail size={20} />} label="Contacts" />
            <SettingsItem icon={<UserCheck size={20} />} label="Verification" isLast />
          </div>
        </section>

        {/* SECURITY */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('settings.security')}</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <SettingsItem icon={<Key size={20} />} label="Password" />
            <SettingsItem icon={<Shield size={20} />} label="Two-Factor Authentication" />
            <SettingsItem icon={<Grid size={20} />} label="App PIN" isLast />
          </div>
        </section>

        {/* GENERAL */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">General</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <SettingsItem 
              icon={<Image size={20} />} 
              label={t('nav.terminal')} 
              onClick={() => setActiveSubPage('TRADING')}
            />
            <SettingsItem 
              icon={<Activity size={20} />} 
              label={t('settings.appearance')} 
              onClick={() => setActiveSubPage('APPEARANCE')}
            />
            <SettingsItem 
              icon={<Bell size={20} />} 
              label={t('settings.notifications')} 
              onClick={() => setActiveSubPage('NOTIFICATIONS')}
              isLast 
            />
          </div>
        </section>

        {/* Footer Actions */}
        <div className="space-y-3 pt-4 pb-8">
            <button 
              onClick={onLogout}
              className="w-full bg-[#1e222d] text-[#ff4757] font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-white/5 hover:bg-[#2a2e39] transition active:scale-[0.98]"
            >
                <LogOut size={20} />
                <span>{t('settings.logout')}</span>
            </button>
            <button className="w-full bg-transparent text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-white/5 transition active:scale-[0.98]">
                Delete Profile
            </button>
        </div>
      </div>

      {/* Sub-Pages Overlay */}
      <AnimatePresence>
        {activeSubPage === 'TRADING' && (
          <TradingPlatformSettings onBack={() => setActiveSubPage(null)} />
        )}
        {activeSubPage === 'APPEARANCE' && (
          <AppearanceSettings 
            onBack={() => setActiveSubPage(null)} 
            timezoneOffset={timezoneOffset}
            setTimezoneOffset={setTimezoneOffset}
          />
        )}
        {activeSubPage === 'NOTIFICATIONS' && (
          <NotificationSettings onBack={() => setActiveSubPage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsItem({ icon, label, isLast, onClick }: { icon: React.ReactNode, label: string, isLast?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 cursor-pointer hover:bg-[#2a2e39] transition active:bg-[#2a2e39]/80",
        !isLast && "border-b border-white/5"
      )}
    >
      <div className="flex items-center gap-3 text-gray-300">
        {icon}
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-500" />
    </div>
  );
}

export default function TradingPlatform() {
  const { t } = useTranslation();
  // --- Theme Initialization ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'HOME' | 'TRADING' | 'PROFILE' | 'MARKET' | 'REWARDS' | 'REFERRAL' | 'HELP' | 'TRADES' | 'SETTINGS' | 'ADMIN'>('HOME');
  const [data, setData] = useState<OHLCData[]>([]);
  const [tickHistory, setTickHistory] = useState<Record<string, TickData[]>>({});
  const [currentPrice, setCurrentPrice] = useState<number>(51.677);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [marketAssets, setMarketAssets] = useState<Record<string, any>>({});
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supportSettings, setSupportSettings] = useState({ telegram: 'https://t.me/onyxtrade_support', whatsapp: 'https://wa.me/1234567890', email: 'support@onyxtrade.com' });
  const [referralSettings, setReferralSettings] = useState({ bonusAmount: 10, referralPercentage: 5, minDepositForBonus: 20 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isBoosted, setIsBoosted] = useState(false);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [investment, setInvestment] = useState<number>(32); // D32
  const [duration, setDuration] = useState<number>(60); // 1 min
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('onyx_trades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep trades from the last 24 hours to keep storage clean
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return parsed.filter((t: Trade) => t.startTime > dayAgo);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [timezoneOffset, setTimezoneOffset] = useState<number>(() => {
    return Number(localStorage.getItem('app-timezone-offset')) || 0;
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refs for stable socket listeners
  const balanceRef = useRef(balance);
  const tradesRef = useRef(trades);
  const dataRef = useRef(data);
  const userRef = useRef(user);

  useEffect(() => {
    localStorage.setItem('onyx_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('app-timezone-offset', timezoneOffset.toString());
  }, [timezoneOffset]);

  useEffect(() => {
    balanceRef.current = balance;
    tradesRef.current = trades;
    dataRef.current = data;
    userRef.current = user;
  }, [balance, trades, data, user]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync User Data from Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.balance !== undefined) {
          setBalance(userData.balance);
          // Auto refill if balance is zero
          if (userData.balance <= 0) {
            updateDoc(userRef, { balance: INITIAL_BALANCE });
          }
        }
        if (userData.trades !== undefined) setTrades(userData.trades);
      } else {
        // Initialize user if doc doesn't exist
        setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          balance: INITIAL_BALANCE,
          trades: [],
          createdAt: Date.now()
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync user data to server
  useEffect(() => {
    if (socket && user) {
      socket.emit('user-sync', {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        balance: balance,
        trades: trades
      });
    }
  }, [socket, user, balance, trades]);
  const refillDemoBalance = async () => {
    const newBalance = INITIAL_BALANCE;
    setBalance(newBalance);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: newBalance
        });
      } catch (err) {
        console.error("Error refilling balance:", err);
      }
    }
  };

  const syncToFirestore = async (newBalance: number, newTrades: Trade[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        balance: newBalance,
        trades: newTrades
      });
    } catch (err) {
      console.error("Error syncing to Firestore:", err);
    }
  };

  // Sheet States
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false);
  const [isAccountsSheetOpen, setIsAccountsSheetOpen] = useState(false);
  const [isTradeInputSheetOpen, setIsTradeInputSheetOpen] = useState(false);
  const [isRiskManagementOpen, setIsRiskManagementOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<'DEMO' | 'REAL'>('DEMO');
  const [chartTimeFrame, setChartTimeFrame] = useState('1m');
  const [chartType, setChartType] = useState('Candlestick');
  const [sentiment, setSentiment] = useState(57); // Percentage of green (up) sentiment

  // Refs for Data
  const lastCloseRef = useRef(selectedAsset.basePrice);
  const trendRef = useRef(0); // Track trend for smoother movement
  const volatilityRef = useRef(1.0); // Dynamic volatility multiplier

  // Initialize Socket.IO Connection
  useEffect(() => {
    // Connect to the same origin (works with reverse proxy)
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('initial-prices', (prices: Record<string, number>) => {
      if (prices[selectedAsset.shortName]) {
        setCurrentPrice(prices[selectedAsset.shortName]);
        lastCloseRef.current = prices[selectedAsset.shortName];
      }
    });

    newSocket.on('support-settings', (settings) => {
      setSupportSettings(settings);
    });

    newSocket.on('tutorials', (data) => {
      setTutorials(data);
    });

    newSocket.on('referral-settings', (settings) => {
      setReferralSettings(settings);
    });

    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('account-boosted', (boosted) => {
      setIsBoosted(boosted);
    });

    newSocket.on('request-status-updated', ({ requestId, status, message }) => {
      setNotifications(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        title: `Request ${status}`,
        message: message || `Your request has been ${status.toLowerCase()}.`,
        type: status === 'APPROVED' ? 'SUCCESS' : 'DANGER',
        timestamp: Date.now()
      }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('user-update', {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        balance: balance,
        trades: trades,
        isBoosted: isBoosted
      });
    }
  }, [socket, user, balance, trades, isBoosted]);

  // Initialize Data (Candlesticks)
  useEffect(() => {
    if (!socket) return;
    
    setIsLoading(true);
    setData([]); // Clear old data to prevent flickering
    
    // Reset price to asset base price when asset changes
    lastCloseRef.current = selectedAsset.basePrice;
    setCurrentPrice(selectedAsset.basePrice);
    trendRef.current = 0;
    volatilityRef.current = 1.0;

    const handleHistory = (response: { asset: string, data: any[] }) => {
      // Use a ref to check current asset to avoid stale closures if needed, 
      // but here selectedAsset is in dependencies so it should be fine.
      if (response.asset !== selectedAsset.shortName) return;
      
      const ticks = response.data;
      const tfMs = getTimeFrameInMs(chartTimeFrame);
      
      if (!ticks || ticks.length === 0) {
        setIsLoading(false);
        return;
      }

      const candles: OHLCData[] = [];
      const historyTicks: TickData[] = [];
      let currentCandle: OHLCData | null = null;
      
      for (const tick of ticks) {
        historyTicks.push({ time: tick.time, price: tick.price });
        const candleTime = Math.floor(tick.time / tfMs) * tfMs;
        
        if (!currentCandle || currentCandle.time !== candleTime) {
          if (currentCandle) candles.push(currentCandle);
          currentCandle = {
            time: candleTime,
            open: tick.price,
            high: tick.price,
            low: tick.price,
            close: tick.price,
            formattedTime: format(candleTime, 'HH:mm:ss')
          };
        } else {
          currentCandle.high = Math.max(currentCandle.high, tick.price);
          currentCandle.low = Math.min(currentCandle.low, tick.price);
          currentCandle.close = tick.price;
        }
      }
      if (currentCandle) candles.push(currentCandle);
      
      setTickHistory(prev => ({ ...prev, [response.asset]: historyTicks }));
      setData(candles);
      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        lastCloseRef.current = last.close;
        setCurrentPrice(last.close);
      }
      
      // Small delay before hiding loader for smoother transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      clearTimeout(timeout);
    };

    socket.on('asset-history', handleHistory);
    
    // Add a small delay for the request to ensure the UI has cleared
    const requestTimeout = setTimeout(() => {
      if (socket.connected) {
        socket.emit('request-history', selectedAsset.shortName);
      } else {
        socket.once('connect', () => {
          socket.emit('request-history', selectedAsset.shortName);
        });
      }
    }, 100);

    // Fallback if history takes too long
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      socket.off('asset-history', handleHistory);
      clearTimeout(timeout);
      clearTimeout(requestTimeout);
    };
  }, [socket, selectedAsset, chartTimeFrame]);

  // Handle Live Ticks from Server
  useEffect(() => {
    if (!socket) return;

    const handleTick = (ticks: Record<string, any>) => {
      setMarketAssets(prev => ({ ...prev, ...ticks }));
      
      const tick = ticks[selectedAsset.shortName];
      if (!tick) return;

      const timestamp = tick.time;
      const newPrice = tick.price;
      const tfMs = getTimeFrameInMs(chartTimeFrame);

      setCurrentTime(timestamp);
      setCurrentPrice(newPrice);
      lastCloseRef.current = newPrice;

      // Update frozen status if it changed
      if (tick.isFrozen !== selectedAsset.isFrozen) {
        setSelectedAsset(prev => ({ ...prev, isFrozen: tick.isFrozen }));
      }

      // Update Sentiment based on price movement
      setSentiment(prev => {
        const currentData = dataRef.current;
        const priceDiff = newPrice - (currentData.length > 0 ? currentData[currentData.length - 1].close : newPrice);
        const impact = (priceDiff / selectedAsset.volatility) * 3; 
        let next = prev + impact + (Math.random() - 0.5) * 2;
        next += (50 - next) * 0.05;
        return Math.max(10, Math.min(90, next));
      });

      setTickHistory(prev => {
        const assetHistory = prev[selectedAsset.shortName] || [];
        const newHistory = [...assetHistory, { time: timestamp, price: newPrice }];
        const limitedHistory = newHistory.length > 10000 ? newHistory.slice(-10000) : newHistory;
        return { ...prev, [selectedAsset.shortName]: limitedHistory };
      });

      setData(prev => {
        if (prev.length === 0) return prev;
        
        const lastCandle = prev[prev.length - 1];
        const currentTFStart = Math.floor(timestamp / tfMs) * tfMs;
        
        if (currentTFStart < lastCandle.time) {
            // Ignore older ticks to prevent chart errors (out of order data)
            return prev;
        }

        if (lastCandle.time === currentTFStart) {
            // Update existing candle
            const updatedCandle = {
                ...lastCandle,
                close: newPrice,
                high: Math.max(lastCandle.high, newPrice),
                low: Math.min(lastCandle.low, newPrice),
            };
            return [...prev.slice(0, -1), updatedCandle];
        } else {
            // New candle started
            const newCandle = {
                time: currentTFStart,
                open: lastCandle.close,
                high: Math.max(lastCandle.close, newPrice),
                low: Math.min(lastCandle.close, newPrice),
                close: newPrice,
                formattedTime: format(currentTFStart, 'HH:mm:ss'),
            };
            const newData = [...prev, newCandle];
            if (newData.length > 10000) newData.shift();
            return newData;
        }
      });
    };

    socket.on('market-tick', handleTick);

    return () => {
      socket.off('market-tick', handleTick);
    };
  }, [socket, selectedAsset, chartTimeFrame]); // Removed data from dependencies

  // Handle Trade Results from Server
  useEffect(() => {
    if (!socket) return;

    const handleTradeResult = (result: any) => {
      const currentTrades = tradesRef.current;
      const updatedTrades = currentTrades.map(trade => {
        if (trade.id === result.id) {
          const isWin = result.status === 'WIN';
          const profit = isWin ? result.profit : -trade.amount;
          
          return { 
            ...trade, 
            status: result.status, 
            profit: profit, 
            closePrice: result.closePrice 
          };
        }
        return trade;
      });

      setTrades(updatedTrades);

      // Calculate new balance
      let newBalance = balanceRef.current;
      const trade = currentTrades.find(t => t.id === result.id);
      if (trade && result.status === 'WIN') {
        newBalance = balanceRef.current + trade.amount + result.profit;
        setBalance(newBalance);
      }

      // Sync to Firestore
      if (userRef.current) {
        updateDoc(doc(db, 'users', userRef.current.uid), {
          balance: newBalance,
          trades: updatedTrades
        }).catch(err => console.error("Error syncing trade result to Firestore:", err));
      }

      // Add to results toast
      setTradeResults(r => [...r, { id: result.id, profit: result.profit, isWin: result.status === 'WIN' }]);
    };

    socket.on('trade-result', handleTradeResult);

    return () => {
      socket.off('trade-result', handleTradeResult);
    };
  }, [socket]); // Removed balance and user from dependencies

  // Clear Toasts
  useEffect(() => {
    if (tradeResults.length > 0) {
      const timer = setTimeout(() => setTradeResults(prev => prev.slice(1)), 3000);
      return () => clearTimeout(timer);
    }
  }, [tradeResults]);



  const handleTrade = (type: 'UP' | 'DOWN') => {
    if (selectedAsset.isFrozen) return alert("Trading is currently closed for this asset.");
    if (balance < investment) return alert("Insufficient balance");

    // Risk Management Check
    const savedRM = localStorage.getItem('risk_management');
    if (savedRM) {
      const rm = JSON.parse(savedRM);
      
      // Max Trade Amount Check
      if (rm.maxTradeAmount > 0 && investment > rm.maxTradeAmount) {
        return alert(`Risk Management: Max trade amount is ৳${rm.maxTradeAmount}`);
      }

      // Calculate Daily PnL based on selected timezone
      const now = Date.now();
      const offsetMs = timezoneOffset * 3600000;
      const todayInTimezone = new Date(now + offsetMs);
      todayInTimezone.setUTCHours(0, 0, 0, 0);
      const todayStartUtc = todayInTimezone.getTime() - offsetMs;

      const todaysTrades = trades.filter(t => t.startTime >= todayStartUtc && t.status !== 'ACTIVE');
      let dailyPnL = 0;
      todaysTrades.forEach(t => {
        if (t.profit !== undefined) {
          dailyPnL += t.profit;
        } else if (t.status === 'WIN') {
          dailyPnL += (t.amount * (t.payout / 100));
        } else if (t.status === 'LOSS') {
          dailyPnL -= t.amount;
        }
      });

      // Daily Stop Loss Check
      if (rm.dailyStopLoss > 0 && dailyPnL <= -rm.dailyStopLoss) {
        return alert(`Risk Management: Daily Stop Loss of ৳${rm.dailyStopLoss} reached. Trading restricted.`);
      }

      // Daily Take Profit Check
      if (rm.dailyTakeProfit > 0 && dailyPnL >= rm.dailyTakeProfit) {
        return alert(`Risk Management: Daily Take Profit of ৳${rm.dailyTakeProfit} reached. Trading restricted.`);
      }
    }

    const entryPrice = lastCloseRef.current;
    const newBalance = balance - investment;
    setBalance(newBalance);
    
    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      entryPrice: entryPrice,
      amount: investment,
      startTime: Date.now(),
      endTime: Date.now() + duration * 1000,
      duration,
      status: 'ACTIVE',
      payout: selectedAsset.payout,
      asset: selectedAsset.name,
      assetShortName: selectedAsset.shortName,
      assetFlag: selectedAsset.flag,
      assetCategory: selectedAsset.category
    };

    const newTrades = [newTrade, ...trades];
    setTrades(newTrades);
    syncToFirestore(newBalance, newTrades);

    if (socket) {
      socket.emit('place-trade', newTrade);
    }
  };

  const activeTrades = trades.filter(t => t.status === 'ACTIVE' && t.assetShortName === selectedAsset.shortName);

  const potentialProfit = (investment * selectedAsset.payout / 100).toFixed(2);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <HomePage 
        tutorials={tutorials}
        onStartTrading={() => {
          if (user) {
            setView('TRADING');
          } else {
            // If not logged in, Auth component will be shown by the next check
            setView('TRADING');
          }
        }} 
        onLogin={() => {
          setView('TRADING');
        }}
      />
    );
  }

  if (!user) {
    return <Auth onSuccess={() => setView('TRADING')} />;
  }

  if (view === 'PROFILE' && user) {
    return (
      <ProfilePage 
        onBack={() => setView('TRADING')} 
        onSettings={() => setView('SETTINGS')} 
        user={user} 
        onAdmin={() => setView('ADMIN')} 
        isBoosted={isBoosted}
        setView={setView}
      />
    );
  }

  if (view === 'SETTINGS') {
    return <SettingsPage 
      onBack={() => setView('PROFILE')} 
      onLogout={() => {
        signOut(auth);
        setView('TRADING');
      }} 
      timezoneOffset={timezoneOffset}
      setTimezoneOffset={setTimezoneOffset}
    />;
  }

  if (view === 'ADMIN' && user) {
    return <AdminPanel socket={socket} onBack={() => setView('TRADING')} userEmail={user.email || ''} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden select-none">
      
      {/* --- Top Header (Only for Trading) --- */}
      {view === 'TRADING' && (
        <header className="flex items-center justify-between px-4 py-1 bg-[var(--bg-primary)] z-20 border-b border-[var(--border-color)]">
          {/* Left: Profile */}
          <div 
            onClick={() => setView('PROFILE')}
            className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] relative cursor-pointer active:scale-95 transition hover:bg-[var(--bg-tertiary)]"
          >
            <User size={18} />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-[var(--bg-primary)] rounded-full"></div>
          </div>

          {/* Center: Balance */}
          <div 
            onClick={() => setIsAccountsSheetOpen(true)}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition group"
          >
            <div className="text-[var(--text-primary)] font-bold text-lg tracking-tight leading-tight">
              {activeAccount === 'DEMO' ? 'Đ' : '৳'}
              {activeAccount === 'DEMO' 
                ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'
              }
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-medium transition-colors",
              activeAccount === 'DEMO' ? "text-orange-400 group-hover:text-orange-300" : "text-green-500 group-hover:text-green-400"
            )}>
              {activeAccount === 'DEMO' ? 'Demo account' : 'BDT Account'} <ChevronDown size={12} strokeWidth={3} />
            </div>
          </div>

          {/* Right: Wallet & Admin */}
          <div className="flex items-center gap-2">
            {(user?.email?.toLowerCase() === 'hasan@gmail.com' || user?.email?.toLowerCase() === 'tasmeaykhatun565@gmail.com') && (
              <button 
                onClick={() => setView('ADMIN')}
                className="w-11 h-9 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/30 transition active:scale-95"
                title="Admin Panel"
              >
                <Settings size={20} strokeWidth={2.5} />
              </button>
            )}
            <button 
              onClick={() => setIsPaymentsOpen(true)}
              className="w-11 h-9 bg-[#22c55e] rounded-xl flex items-center justify-center text-[#0a2e16] shadow-[0_4px_12px_rgba(34,197,94,0.2)] hover:bg-[#22c55e]/90 transition active:scale-95"
            >
              <Wallet size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>
      )}

      {/* --- Asset Bar (Only for Trading) --- */}
      {view === 'TRADING' && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--bg-primary)] z-10 border-b border-[var(--border-color)]">
          <div 
            onClick={() => setIsAssetSelectorOpen(true)}
            className="flex items-center gap-3 cursor-pointer active:scale-95 transition -ml-1 rounded-lg hover:bg-white/5 py-1 px-1"
          >
            <div className="relative">
              <AssetIcon 
                shortName={selectedAsset.shortName} 
                category={selectedAsset.category} 
                flag={selectedAsset.flag} 
              />
              {selectedAsset.isFrozen && (
                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-[#101114]">
                  <Lock size={8} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-primary)] font-bold text-sm tracking-wide">{selectedAsset.name.split('(')[0].trim()}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium">OTC</span>
                <ChevronDown size={12} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex items-center gap-1.5">
                 <span className="text-green-500 text-[10px] font-bold">{selectedAsset.payout}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-5 text-[var(--text-secondary)]">
            <Signal size={20} strokeWidth={1.5} className="hover:text-[var(--text-primary)] transition cursor-pointer" />
            <Shield size={20} strokeWidth={1.5} className="hover:text-[var(--text-primary)] transition cursor-pointer" onClick={() => setIsRiskManagementOpen(true)} />
            <Compass size={20} strokeWidth={1.5} className="hover:text-[var(--text-primary)] transition cursor-pointer" />
            <div 
              onClick={() => setIsChartSettingsOpen(true)}
              className="flex items-center gap-1.5 text-[var(--text-primary)] cursor-pointer hover:text-[var(--text-secondary)] transition active:scale-95"
            >
              <div className="flex items-center justify-center w-5 h-5">
                 <BarChart2 size={20} strokeWidth={1.5} className="text-[var(--text-primary)]" />
              </div>
              <span className="text-xs font-bold">{chartTimeFrame}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Asset Selector Overlay --- */}
      <AnimatePresence>
        {isAssetSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50"
          >
             <AssetSelector 
                isOpen={isAssetSelectorOpen} 
                onClose={() => setIsAssetSelectorOpen(false)} 
                onSelect={setSelectedAsset}
                currentAssetId={selectedAsset.id}
                marketAssets={marketAssets}
             />
          </motion.div>
        )}
      </AnimatePresence>

      <AccountsSheet 
        isOpen={isAccountsSheetOpen}
        onClose={() => setIsAccountsSheetOpen(false)}
        balance={balance}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccount}
        onRefill={refillDemoBalance}
      />

      {/* --- Main Content Area --- */}
      <div className="flex-1 relative bg-[var(--bg-primary)] overflow-hidden">
        {view === 'TRADING' && (
          <div className="w-full h-full relative">
            {/* Sentiment Bar (Left) */}
            <div className="absolute left-1 top-4 bottom-16 w-1 bg-[var(--bg-tertiary)]/30 mx-1 rounded-full overflow-hidden flex flex-col z-10 pointer-events-none">
              <div className="bg-red-500 w-full relative transition-all duration-200" style={{ height: `${100 - sentiment}%` }}>
                 <span className="absolute top-0 left-2 text-[10px] text-red-500 font-bold">{Math.round(100 - sentiment)}%</span>
              </div>
              <div className="flex-1 bg-green-500 w-full relative transition-all duration-200">
                 <span className="absolute bottom-0 left-2 text-[10px] text-green-500 font-bold">{Math.round(sentiment)}%</span>
              </div>
            </div>

            <TradingChart 
              key={`${selectedAsset.shortName}-${chartTimeFrame}`}
              data={data}
              trades={activeTrades}
              assetName={selectedAsset.name}
              currentTime={currentTime}
              chartType={chartType}
              chartTimeFrame={chartTimeFrame}
              isLoading={isLoading}
              timezoneOffset={timezoneOffset}
            />


            {/* Bottom Info Overlay */}
            <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] text-gray-500 font-medium z-10 pointer-events-none">
              <span>Fixed Time mode</span>
              <div className="flex items-center gap-1">
                <span>Profit:</span>
                <span className="text-[#2ebd85] font-bold">+D{potentialProfit}</span>
                <HelpCircle size={10} />
              </div>
            </div>
          </div>
        )}

        {view === 'TRADES' && (
          <TradesPage 
            trades={trades} 
            tickHistory={tickHistory} 
            currentPrice={currentPrice} 
            currentTime={currentTime} 
            currentAssetShortName={selectedAsset.shortName}
            marketAssets={marketAssets}
            onViewAsset={() => { setView('TRADING'); setIsAssetSelectorOpen(true); }} 
          />
        )}
        {view === 'MARKET' && <MarketPage />}
        {view === 'REWARDS' && <RewardsPage isBoosted={isBoosted} />}
        {view === 'REFERRAL' && <ReferralPage user={user} referralSettings={referralSettings} />}
        {view === 'HELP' && (
          <HelpPage 
            onSupportClick={() => setIsChatOpen(true)} 
            supportSettings={supportSettings}
            tutorials={tutorials}
          />
        )}
      </div>

      {/* --- Support Chat Overlay --- */}
      <AnimatePresence>
        {isChatOpen && (
          <SupportChat 
            onClose={() => setIsChatOpen(false)} 
            supportSettings={supportSettings}
          />
        )}
      </AnimatePresence>

      {/* --- Bottom Controls (Only for Trading) --- */}
      {view === 'TRADING' && (
        <div className="bg-[var(--bg-primary)] px-2 py-1 z-20 border-t border-[var(--border-color)]">
          {selectedAsset.isFrozen ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 w-full justify-center">
                <Lock size={16} />
                <span className="font-bold text-sm">Trading is closed for this asset</span>
              </div>
              <button 
                onClick={() => setIsAssetSelectorOpen(true)}
                className="w-full bg-[var(--bg-secondary)] text-blue-500 py-2 rounded-xl font-bold text-xs border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition"
              >
                Explore other assets
              </button>
            </div>
          ) : (
            <>
              {/* Row 1: Inputs */}
              <div className="flex items-center gap-2 mb-1">
                {/* Time Input Group */}
                <div className="flex-1 flex items-center bg-[var(--bg-secondary)] rounded-lg h-8 p-0.5 border border-[var(--border-color)]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDuration(Math.max(30, duration - 30)); }}
                    className="w-8 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-white/5 rounded transition"
                  >
                    <Minus size={12} />
                  </button>
                  <div 
                    onClick={() => setIsTradeInputSheetOpen(true)}
                    className="flex-1 text-center text-[var(--text-primary)] font-bold text-xs cursor-pointer hover:text-[var(--text-secondary)] transition"
                  >
                    {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)} min` : `${duration} sec`}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDuration(duration + 30); }}
                    className="w-8 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-white/5 rounded transition"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Investment Input Group */}
                <div className="flex-1 flex items-center bg-[var(--bg-secondary)] rounded-lg h-8 p-0.5 border border-[var(--border-color)]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInvestment(Math.max(1, Math.floor(investment / 2))); }}
                    className="w-8 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-white/5 rounded transition"
                  >
                    <Divide size={12} />
                  </button>
                  <div 
                    onClick={() => setIsTradeInputSheetOpen(true)}
                    className="flex-1 text-center text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-0.5 cursor-pointer hover:text-[var(--text-secondary)] transition"
                  >
                    <span className="text-[var(--text-secondary)]">D</span>
                    <input 
                      type="number" 
                      value={investment} 
                      onChange={e => setInvestment(Number(e.target.value))}
                      className="bg-transparent w-8 text-center focus:outline-none pointer-events-none"
                      readOnly
                    />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInvestment(investment * 2); }}
                    className="w-8 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-white/5 rounded transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Row 2: Trade Buttons */}
              <div className="flex items-center gap-2 h-9 mb-0.5">
                <button 
                  onClick={() => handleTrade('DOWN')}
                  className="flex-1 h-full bg-red-500 hover:bg-red-600 active:scale-[0.98] transition rounded-lg flex items-center justify-between px-3 shadow-sm"
                >
                  <span className="font-bold text-white text-xs">Down</span>
                  <ArrowDown size={16} strokeWidth={3} className="text-white" />
                </button>

                {/* Middle Clock/Pending Button */}
                <button className="w-9 h-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.95] transition rounded-lg flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)]">
                  <Clock size={16} />
                </button>

                <button 
                  onClick={() => handleTrade('UP')}
                  className="flex-1 h-full bg-green-500 hover:bg-green-600 active:scale-[0.98] transition rounded-lg flex items-center justify-between px-3 shadow-sm"
                >
                  <span className="font-bold text-white text-xs">Up</span>
                  <ArrowUp size={16} strokeWidth={3} className="text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- Bottom Navigation --- */}
      <nav className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] px-2 py-1 flex justify-between items-center text-[9px] font-medium text-[var(--text-secondary)]">
        <NavButton 
          icon={<BarChart2 size={18} />} 
          label={t('nav.terminal')} 
          active={view === 'TRADING'} 
          onClick={() => setView('TRADING')}
        />
        <NavButton 
          icon={<ArrowUpDown size={18} />} 
          label={t('nav.trades')} 
          count={activeTrades.length} 
          active={view === 'TRADES'}
          onClick={() => setView('TRADES')}
        />
        <NavButton 
          icon={<ShoppingBag size={18} />} 
          label={t('nav.market')} 
          active={view === 'MARKET'}
          onClick={() => setView('MARKET')}
        />
        <NavButton 
          icon={<Trophy size={18} />} 
          label={t('nav.rewards')} 
          active={view === 'REWARDS'}
          onClick={() => setView('REWARDS')}
        />
        <NavButton 
          icon={<HelpCircle size={18} />} 
          label={t('nav.help')} 
          active={view === 'HELP'}
          onClick={() => setView('HELP')}
        />
      </nav>

      {/* --- Sheets --- */}
      <PaymentsSheet 
        isOpen={isPaymentsOpen} 
        onClose={() => setIsPaymentsOpen(false)} 
        balance={balance}
        activeAccount={activeAccount}
      />
      
      <ChartSettingsSheet 
        isOpen={isChartSettingsOpen} 
        onClose={() => setIsChartSettingsOpen(false)}
        currentTimeFrame={chartTimeFrame}
        onTimeFrameChange={(tf) => {
          setChartTimeFrame(tf);
          setIsChartSettingsOpen(false);
        }}
        currentChartType={chartType}
        onChartTypeChange={setChartType}
      />

      <TradeInputSheet 
        isOpen={isTradeInputSheetOpen}
        onClose={() => setIsTradeInputSheetOpen(false)}
        duration={duration}
        onDurationChange={setDuration}
        investment={investment}
        onInvestmentChange={setInvestment}
        currentPrice={currentPrice}
      />

      <RiskManagementSheet
        isOpen={isRiskManagementOpen}
        onClose={() => setIsRiskManagementOpen(false)}
        balance={balance}
      />
    </div>
  );
}

function NavButton({ icon, label, active, count, onClick }: { icon: React.ReactNode, label: string, active?: boolean, count?: number, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "flex flex-col items-center gap-0.5 p-1 rounded-lg transition min-w-[50px] relative",
      active ? "text-[var(--text-primary)]" : "hover:text-[var(--text-secondary)]"
    )}>
      <div className={cn("p-1 rounded-md", active && "bg-[var(--text-primary)]/10")}>
        {icon}
      </div>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute top-0 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-[var(--bg-primary)]">
          {count}
        </span>
      )}
    </button>
  );
}



function TradeDetailsSheet({ trade, onClose, tickHistory }: { trade: Trade, onClose: () => void, tickHistory: TickData[] }) {
  const isWin = trade.status === 'WIN';
  const isLoss = trade.status === 'LOSS';
  const profit = trade.profit !== undefined ? trade.profit : (isWin ? trade.amount * (trade.payout / 100) : -trade.amount);
  
  // Format profit string
  let profitString = `Đ${Math.abs(profit).toFixed(2)}`;
  let profitColor = 'text-gray-400';
  
  if (isWin) {
    profitString = `+Đ${profit.toFixed(2)}`;
    profitColor = 'text-[#22c55e]';
  } else if (isLoss) {
    profitString = `-Đ${Math.abs(profit).toFixed(2)}`;
    profitColor = 'text-[#ff4757]';
  } else {
    profitString = `Đ0.00`;
  }

  // Generate chart data from history or fallback to simulation
  const chartData = useMemo(() => {
    const endTime = trade.status === 'ACTIVE' ? Date.now() : trade.endTime;
    const relevantTicks = tickHistory.filter(t => t.time >= trade.startTime - 5000 && t.time <= endTime + 2000);
    
    // If we have enough real data (at least 2 points), use it
    if (relevantTicks.length > 1) {
        return relevantTicks.map((t, i) => ({
            i,
            price: t.price,
            time: t.time
        }));
    }

    // Fallback: Generate fake chart data for the trade duration
    const data = [];
    const points = 30;
    const startPrice = trade.entryPrice;
    const endPrice = trade.closePrice || trade.entryPrice;
    
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const trend = startPrice + (endPrice - startPrice) * progress;
      const noise = (Math.random() - 0.5) * (Math.abs(endPrice - startPrice) * 0.3);
      
      let price = trend + noise;
      if (i === 0) price = startPrice;
      if (i === points) price = endPrice;
      
      data.push({ i, price });
    }
    return data;
  }, [trade, tickHistory]);

  const minPrice = Math.min(...chartData.map(d => d.price), trade.entryPrice, trade.closePrice || trade.entryPrice);
  const maxPrice = Math.max(...chartData.map(d => d.price), trade.entryPrice, trade.closePrice || trade.entryPrice);
  const range = maxPrice - minPrice;
  const padding = range * 0.2 || 0.001;

  const getCoordY = (price: number) => {
    return 100 - ((price - (minPrice - padding)) / (range + 2 * padding) * 100);
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]"
    >
      {/* Header */}
      <div className="flex items-center justify-center p-4 relative border-b border-[var(--border-color)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Trade Details</h2>
        <button onClick={onClose} className="absolute right-4 p-2 bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Asset Header */}
        <div className="flex justify-between items-start mb-6 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-lg">
          <div className="flex items-center gap-4">
            <AssetIcon 
              shortName={trade.assetShortName} 
              category={trade.assetCategory} 
              flag={trade.assetFlag} 
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-primary)] font-bold text-lg">{trade.assetShortName}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 bg-[var(--text-primary)]/5 rounded text-[var(--text-secondary)]">{trade.payout}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-2xl font-black text-[var(--text-primary)]">
                <span>Đ{trade.amount.toFixed(2)}</span>
                {trade.type === 'UP' ? <ArrowUp size={20} className="text-[#22c55e]" strokeWidth={3} /> : <ArrowDown size={20} className="text-[#ff4757]" strokeWidth={3} />}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{trade.status === 'ACTIVE' ? 'Time Left' : 'Duration'}</span>
            <span className={cn("text-2xl font-black", profitColor)}>{profitString}</span>
          </div>
        </div>

        {/* Professional Trade Path View */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1">Trade Path</h3>
          <div className="h-56 bg-[var(--bg-secondary)] rounded-2xl relative overflow-hidden border border-[var(--border-color)] p-4 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={trade.status === 'ACTIVE' ? '#3b82f6' : (isWin ? '#22c55e' : '#ff4757')} 
                  strokeWidth={3} 
                  dot={false} 
                  animationDuration={1500}
                />
                <ReferenceLine 
                  y={trade.entryPrice} 
                  stroke="#6b7280" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.4}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Custom Markers Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4">
               {/* Entry Point */}
               <div 
                 className={cn(
                   "absolute w-4 h-4 rounded-full border-2 border-[#1e222d] z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center",
                   trade.type === 'UP' ? "bg-[#22c55e]" : "bg-[#ff4757]"
                 )}
                 style={{ 
                   left: '16px', 
                   top: `${getCoordY(trade.entryPrice)}%`,
                   transform: 'translateY(-50%)'
                 }}
               >
                 {trade.type === 'UP' ? <ArrowUp size={10} className="text-white" strokeWidth={4} /> : <ArrowDown size={10} className="text-white" strokeWidth={4} />}
               </div>
               
               {/* Exit Point if finished */}
               {trade.closePrice && (
                 <div 
                   className={cn(
                     "absolute w-4 h-4 rounded-full border-2 border-[#1e222d] z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center",
                     isWin ? "bg-[#22c55e]" : "bg-[#ff4757]"
                   )}
                   style={{ 
                     right: '16px', 
                     top: `${getCoordY(trade.closePrice)}%`,
                     transform: 'translateY(-50%)'
                   }}
                 >
                   <div className="w-1.5 h-1.5 bg-white rounded-full" />
                 </div>
               )}

               {/* Labels */}
               <div className="absolute left-6 text-[9px] font-bold text-gray-400" style={{ top: `${getCoordY(trade.entryPrice)}%`, transform: 'translateY(10px)' }}>
                 ENTRY: {trade.entryPrice.toFixed(5)}
               </div>
               {trade.closePrice && (
                 <div className="absolute right-6 text-[9px] font-bold text-gray-400 text-right" style={{ top: `${getCoordY(trade.closePrice)}%`, transform: 'translateY(10px)' }}>
                   EXIT: {trade.closePrice.toFixed(5)}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-1 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-lg mb-8">
          <DetailRow label="Trade ID" value={trade.id.slice(0, 12).toUpperCase()} />
          <DetailRow label="Asset" value={trade.assetShortName} />
          <DetailRow label="Type" value={trade.type} valueClassName={trade.type === 'UP' ? 'text-[#22c55e]' : 'text-[#ff4757]'} />
          <DetailRow label="Amount" value={`Đ${trade.amount.toFixed(2)}`} />
          <DetailRow label="Payout" value={`${trade.payout}%`} />
          <DetailRow label="Status" value={trade.status} valueClassName={profitColor} />
          <DetailRow label="Profit/Loss" value={profitString} valueClassName={profitColor} />
          <DetailRow label="Entry Price" value={trade.entryPrice.toFixed(5)} />
          <DetailRow label="Close Price" value={trade.closePrice?.toFixed(5) || '---'} />
          <DetailRow label="Opened" value={format(trade.startTime, 'HH:mm:ss')} />
          <DetailRow label="Closed" value={format(trade.endTime, 'HH:mm:ss')} />
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black py-4 rounded-2xl hover:opacity-90 transition active:scale-[0.98] shadow-xl uppercase tracking-widest text-sm"
        >
          Back to Terminal
        </button>
      </div>
    </motion.div>
  );
}

const DetailRow = ({ label, value, valueClassName }: { label: string, value: string, valueClassName?: string }) => (
  <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--text-primary)]/5 transition">
    <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">{label}</span>
    <span className={cn("font-bold text-sm text-[var(--text-primary)]", valueClassName)}>{value}</span>
  </div>
);

function TradesPage({ trades, onViewAsset, tickHistory, currentPrice, currentTime, currentAssetShortName, marketAssets }: { trades: Trade[], onViewAsset: () => void, tickHistory: Record<string, TickData[]>, currentPrice: number, currentTime: number, currentAssetShortName: string, marketAssets: Record<string, any> }) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const activeTrades = trades.filter(t => t.status === 'ACTIVE');
  const closedTrades = trades.filter(t => t.status !== 'ACTIVE').sort((a, b) => b.endTime - a.endTime);

  return (
    <div className="h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col relative">
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-bold">Trades</h1>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] px-4 mb-4">
        <button className="px-4 py-2 border-b-2 border-[var(--text-primary)] font-bold text-sm text-[var(--text-primary)]">Fixed Time</button>
        <button className="px-4 py-2 text-[var(--text-secondary)] font-medium text-sm">Forex</button>
        <button className="px-4 py-2 text-[var(--text-secondary)] font-medium text-sm">Stocks</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Open Trades Section */}
        {activeTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-[200px]">You have no open Fixed Time trades on this account</p>
            <button 
              onClick={onViewAsset}
              className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold py-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition"
            >
              Explore Assets
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-8">
             <h2 className="text-lg font-bold mb-2">Open Trades</h2>
             {activeTrades.map(trade => (
               <TradeItem 
                  key={trade.id} 
                  trade={trade} 
                  currentPrice={marketAssets[trade.assetShortName]?.price || currentPrice}
                  currentTime={currentTime}
                  onClick={() => setSelectedTrade(trade)} 
                />
             ))}
          </div>
        )}

        {/* Closed Trades Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Closed Trades</h2>
          <button className="text-xs text-[var(--text-secondary)] flex items-center gap-1 hover:text-[var(--text-primary)] transition">
            Show All <ChevronLeft className="rotate-180" size={12}/>
          </button>
        </div>

        <div className="space-y-2">
          {closedTrades.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">No trade history yet</p>
          ) : (
            closedTrades.map(trade => (
              <TradeItem key={trade.id} trade={trade} onClick={() => setSelectedTrade(trade)} />
            ))
          )}
        </div>
      </div>

      {/* Trade Details Sheet Overlay */}
      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailsSheet 
            trade={selectedTrade} 
            tickHistory={tickHistory[selectedTrade.assetShortName] || []} 
            onClose={() => setSelectedTrade(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const TradeItem: React.FC<{ trade: Trade, onClick?: () => void, currentPrice?: number, currentTime?: number }> = ({ trade, onClick, currentPrice, currentTime }) => {
  const isActive = trade.status === 'ACTIVE';
  
  let profitString = '';
  let profitColor = 'text-gray-400';
  let timeString = '';

  if (isActive && currentPrice !== undefined && currentTime !== undefined) {
    // Active Trade Logic
    const timeLeft = Math.max(0, Math.ceil((trade.endTime - currentTime) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isWinning = trade.type === 'UP' 
      ? currentPrice > trade.entryPrice 
      : currentPrice < trade.entryPrice;
    
    const potentialProfit = trade.amount * (trade.payout / 100);
    
    if (isWinning) {
        profitString = `+Đ${potentialProfit.toFixed(2)}`;
        profitColor = 'text-[#22c55e]';
    } else {
        profitString = `-Đ${trade.amount.toFixed(2)}`;
        profitColor = 'text-[#ff4757]';
    }

  } else {
    // Closed Trade Logic
    const isWin = trade.status === 'WIN';
    const isLoss = trade.status === 'LOSS';
    const profit = trade.profit !== undefined ? trade.profit : (isWin ? trade.amount * (trade.payout / 100) : -trade.amount);

    timeString = Math.floor(trade.duration / 60) > 0 ? `${Math.floor(trade.duration / 60)} min` : `${trade.duration} sec`;

    if (isWin) {
      profitString = `+Đ${profit.toFixed(2)}`;
      profitColor = 'text-[#22c55e]';
    } else if (isLoss) {
      profitString = `-Đ${Math.abs(profit).toFixed(2)}`;
      profitColor = 'text-[#ff4757]';
    } else {
      profitString = `Đ0.00`;
    }
  }

  return (
    <div 
      onClick={onClick}
      className="bg-[#1e222d] p-3 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition hover:bg-[#2a2e39]"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <AssetIcon 
            shortName={trade.assetShortName} 
            category={trade.assetCategory} 
            flag={trade.assetFlag} 
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1e222d] flex items-center justify-center border border-[#1e222d] z-30">
             {trade.type === 'UP' 
               ? <ArrowUp size={10} className="text-[#22c55e]" strokeWidth={3} /> 
               : <ArrowDown size={10} className="text-[#ff4757]" strokeWidth={3} />
             }
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold text-sm">{trade.assetShortName}</span>
            <span className="text-xs text-gray-500">· {isActive ? `${trade.payout}%` : 'Fixed Time'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white font-medium">
            <span>Đ{trade.amount.toFixed(2)}</span>
            {trade.type === 'UP' ? <span className="text-[#22c55e]">↑</span> : <span className="text-[#ff4757]">↓</span>}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <span className={cn("text-[10px] mb-0.5 font-medium", isActive ? "text-[#3b82f6]" : "text-gray-500")}>
            {isActive ? `Ends in ${timeString}` : timeString}
        </span>
        <span className={cn("font-bold text-sm", profitColor)}>
          {profitString}
        </span>
      </div>
    </div>
  );
}

function ProfilePage({ onBack, onSettings, user, onAdmin, isBoosted, setView }: { onBack: () => void, onSettings: () => void, user: FirebaseUser, onAdmin: () => void, isBoosted: boolean, setView: (v: any) => void }) {
  return (
    <div className="min-h-screen bg-[#101114] text-white font-sans p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-white">
          <ChevronLeft size={28} />
        </button>
        <button className="p-2 -mr-2 text-white relative">
          <Bell size={24} />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#101114]"></div>
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#1e222d] flex items-center justify-center mb-4 border-2 border-white/5 overflow-hidden shadow-2xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>
          {isBoosted && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1.5 rounded-full border-4 border-[#101114] shadow-lg">
              <Zap size={14} fill="currentColor" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black mb-1">{user.displayName || user.email?.split('@')[0]}</h1>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span>{user.email}</span>
          <Copy size={14} className="cursor-pointer hover:text-white transition" />
        </div>
        
        {(user.email?.toLowerCase() === 'hasan@gmail.com' || user.email?.toLowerCase() === 'tasmeaykhatun565@gmail.com') && (
          <button 
            onClick={onAdmin}
            className="mt-4 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-full font-black text-xs flex items-center gap-2 hover:bg-red-500/20 transition uppercase tracking-widest"
          >
            <Settings size={14} /> Admin Panel
          </button>
        )}
      </div>

      {/* Status Card */}
      <div className="bg-[#1e222d] rounded-3xl p-6 mb-4 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBoosted ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-widest">{isBoosted ? 'Boosted Account' : 'Starter Account'}</span>
              <div className="text-[10px] text-gray-500 font-bold">Verified Member</div>
            </div>
          </div>
          <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded text-gray-400">LVL 8</span>
        </div>
        <div className="h-2 bg-[#101114] rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-blue-400">1,634 XP</span>
          <span className="text-gray-500">2,500 XP to next level</span>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button 
          onClick={() => setView('REWARDS')}
          className="bg-[#1e222d] rounded-3xl p-5 h-32 flex flex-col justify-between border border-white/5 hover:bg-[#252a36] transition group"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition group-hover:scale-110 ${isBoosted ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white'}`}>
            <Zap size={20} fill={isBoosted ? "currentColor" : "none"} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Boost Status</span>
        </button>
        <button 
          onClick={() => setView('REFERRAL')}
          className="bg-[#1e222d] rounded-3xl p-5 h-32 flex flex-col justify-between border border-white/5 hover:bg-[#252a36] transition group"
        >
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white transition group-hover:scale-110">
            <Gift size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Referrals</span>
        </button>
      </div>

      {/* Settings Button */}
      <button onClick={onSettings} className="w-full bg-[#1e222d] rounded-xl p-4 flex items-center justify-center gap-2 font-bold mt-4 border border-white/5 hover:bg-[#2a2e39] transition">
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </div>
  );
}

function MarketPage() {
  return (
    <div className="h-full overflow-y-auto p-4 pb-20 bg-[#101114]">
      <h1 className="text-lg font-bold mb-4 text-white text-center">Market</h1>
      
      {/* My Purchases & Rewards */}
      <button className="w-full bg-[#1e222d] rounded-xl p-4 flex items-center justify-between mb-6 active:scale-[0.98] transition border border-white/5">
        <span className="font-bold text-white text-sm">My Purchases & Rewards</span>
        <ChevronRight size={20} className="text-gray-400" />
      </button>

      {/* Banners Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-2 scrollbar-hide snap-x">
        {/* Crypto Banner */}
        <div className="min-w-[100%] bg-blue-600 rounded-2xl p-5 relative overflow-hidden h-32 flex flex-col justify-center snap-center">
          <h3 className="font-bold text-xl text-white z-10 mb-1">Crypto</h3>
          <p className="text-xs text-blue-100 z-10 max-w-[65%] leading-relaxed">Strategies, signals, and themes designed for trading on crypto assets</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/50 rounded-full blur-xl"></div>
          {/* 3D Icon Placeholder */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-20 opacity-80">
             <div className="w-full h-full rounded-full border-[6px] border-blue-400/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-[6px] border-blue-300/50"></div>
             </div>
          </div>
        </div>

        {/* Forex Banner */}
        <div className="min-w-[100%] bg-[#1e222d] rounded-2xl p-5 relative overflow-hidden h-32 flex flex-col justify-center border border-white/5 snap-center">
          <h3 className="font-bold text-xl text-white z-10 mb-1">Forex</h3>
          <p className="text-xs text-gray-400 z-10 max-w-[65%] leading-relaxed">Professional tools to help you predict market trends</p>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-20 opacity-80">
             <div className="w-full h-full rounded-full border-[6px] border-orange-500/20 flex items-center justify-center">
                <span className="text-orange-500 font-bold text-xl">FX</span>
             </div>
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
      </div>

      {/* Large Cards List */}
      <div className="space-y-4">
        <MarketCard 
          icon={<Shuffle size={40} className="text-[#22c55e]" />}
          title="Strategies"
          description="Ready-to-use sets of tools that make it easier to spot entry and exit points"
        />
        <MarketCard 
          icon={<Compass size={40} className="text-[#22c55e]" />}
          title="Indicators"
          description="Tools that help analyze price movements and identify entry points"
        />
        <MarketCard 
          icon={<Target size={40} className="text-[#22c55e]" />}
          title="Signals"
          description="Algorithm-based recommendations on when to open trades"
        />
        <MarketCard 
          icon={<ChevronsUp size={40} className="text-[#22c55e]" />}
          title="Trading Conditions"
          description="Features that provide more beneficial trading conditions"
        />
      </div>
    </div>
  );
}

function MarketCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-[#1e222d] rounded-2xl p-6 flex flex-col border border-white/5 active:scale-[0.98] transition cursor-pointer min-h-[200px] relative overflow-hidden">
      <div className="absolute top-6 right-6">
         <div className="w-24 h-24 rounded-[2rem] bg-[#101114] flex items-center justify-center border border-white/5 shadow-inner">
            {icon}
         </div>
      </div>
      <div className="mt-auto max-w-[70%]">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ReferralPage({ user, referralSettings }: { user: FirebaseUser | null, referralSettings: any }) {
  const referralCode = user ? user.uid.slice(0, 8).toUpperCase() : 'LOGIN';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const [copied, setCopied] = useState(false);
  
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Fallback: Copying text command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy using clipboard API: ', err);
          fallbackCopyTextToClipboard(referralLink);
        });
    } else {
      fallbackCopyTextToClipboard(referralLink);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 bg-[#101114]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-white">Referral</h1>
      </div>

      <div className="bg-[#1e222d] rounded-3xl p-6 border border-white/5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Referral Program</h2>
              <p className="text-xs text-gray-400">Invite friends and earn together</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#101114] p-4 rounded-2xl border border-white/5">
              <div className="text-[10px] text-gray-500 uppercase font-black mb-1">You Get</div>
              <div className="text-xl font-black text-green-500">Đ{referralSettings.bonusAmount}</div>
              <div className="text-[10px] text-gray-500 mt-1">Per referral</div>
            </div>
            <div className="bg-[#101114] p-4 rounded-2xl border border-white/5">
              <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Bonus</div>
              <div className="text-xl font-black text-blue-500">{referralSettings.referralPercentage}%</div>
              <div className="text-[10px] text-gray-500 mt-1">On their 1st deposit</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-bold ml-1">Your Referral Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#101114] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono truncate">
                {referralLink}
              </div>
              <button 
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl transition active:scale-90 flex items-center justify-center"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardsPage({ isBoosted }: { isBoosted: boolean }) {
  return (
    <div className="h-full overflow-y-auto p-4 pb-24 bg-[#101114]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-white">Rewards</h1>
        {isBoosted && (
          <div className="bg-yellow-500/20 text-yellow-500 text-[10px] px-3 py-1 rounded-full font-black flex items-center gap-1 border border-yellow-500/30 animate-pulse">
            <Zap size={12} fill="currentColor" /> BOOST ACTIVE
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-white">Tasks & Rewards</h2>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>3 available</span>
          <ChevronLeft className="rotate-180" size={14} />
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
        <div className="min-w-[280px] bg-[#1e222d] rounded-2xl p-6 border border-white/5 relative group">
          <div className="flex justify-between items-start mb-8">
            <p className="text-sm font-bold pr-8 text-white">Use LUNAR2026 when depositing Đ10.00+</p>
            <div className="bg-[#22c55e] text-black text-[10px] font-black px-2 py-1 rounded rotate-12 absolute right-4 top-4 shadow-[0_4px_12px_rgba(34,197,94,0.3)]">110%</div>
          </div>
          <button className="w-full bg-[#2a2e39] py-3 rounded-xl text-xs font-black text-white hover:bg-[#343a46] transition border border-white/5">Apply Promo Code</button>
        </div>
        <div className="min-w-[280px] bg-[#1e222d] rounded-2xl p-6 border border-white/5 relative group">
          <div className="flex justify-between items-start mb-8">
            <p className="text-sm font-bold pr-8 text-white">Use UE5QMQZ0E8 depositing Đ250.00+</p>
            <div className="bg-[#22c55e] text-black text-[10px] font-black px-2 py-1 rounded rotate-12 absolute right-4 top-4 shadow-[0_4px_12px_rgba(34,197,94,0.3)]">UP TO 100%</div>
          </div>
          <button className="w-full bg-[#2a2e39] py-3 rounded-xl text-xs font-black text-white hover:bg-[#343a46] transition border border-white/5">Apply Promo Code</button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-white">Leaderboards</h2>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Your rankings</span>
          <ChevronLeft className="rotate-180" size={14} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 h-28 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-black">Best trade</span>
          <span className="text-xl font-black text-gray-700">—</span>
        </div>
        <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 h-28 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-black">Profit</span>
          <span className="text-xl font-black text-gray-700">—</span>
        </div>
        <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 h-28 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-black">Total trades</span>
          <span className="text-xl font-black text-gray-700">—</span>
        </div>
      </div>
    </div>
  );
}


function HelpPage({ 
  onSupportClick, 
  supportSettings, 
  tutorials 
}: { 
  onSupportClick: () => void;
  supportSettings: { telegram: string; whatsapp: string; email: string };
  tutorials: any[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'tutorials' | 'glossary'>('faq');
  
  const faqs = [
    {
      category: 'Account',
      questions: [
        { q: 'How do I verify my account?', a: 'Go to Profile > Verification and upload your ID documents. Verification usually takes 24-48 hours.' },
        { q: 'Can I have multiple accounts?', a: 'No, each user is allowed only one account to ensure platform security and fair trading.' },
        { q: 'How to reset my password?', a: 'Click on "Forgot Password" on the login screen and follow the instructions sent to your email.' }
      ]
    },
    {
      category: 'Trading',
      questions: [
        { q: 'What is the minimum trade amount?', a: 'The minimum trade amount is Đ1.00 for most assets.' },
        { q: 'How are payouts calculated?', a: 'Payouts are based on the asset volatility and market conditions at the time of trade opening.' },
        { q: 'What happens if a trade ends at the same price?', a: 'If the closing price is exactly equal to the entry price, the trade is a "Draw" and your investment is returned.' }
      ]
    },
    {
      category: 'Payments',
      questions: [
        { q: 'What is the minimum deposit?', a: 'The minimum deposit is Đ10.00 or equivalent in your local currency.' },
        { q: 'How long do withdrawals take?', a: 'Withdrawals are processed within 1-3 business days, depending on your payment method.' },
        { q: 'Are there any deposit fees?', a: 'OnyxTrade does not charge any deposit fees, but your payment provider might.' }
      ]
    }
  ];

  const glossary = [
    { term: 'Asset', definition: 'A financial instrument that can be traded, such as a currency pair, commodity, or stock.' },
    { term: 'Payout', definition: 'The percentage of profit you receive if your trade prediction is correct.' },
    { term: 'Volatility', definition: 'The degree of variation of a trading price series over time.' },
    { term: 'Strike Price', definition: 'The price at which a trade is opened.' },
    { term: 'Expiration Time', definition: 'The time at which a trade is automatically closed and the result is determined.' },
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <div className="bg-[#1e222d] p-8 text-center border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          All Systems Operational
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">Help Center</h1>
        <p className="text-gray-400 mb-6">Search for answers or contact our 24/7 support team.</p>
        
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search for help..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#101114] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition shadow-xl"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 -mt-8">
          <button 
            onClick={onSupportClick}
            className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-[#252a36] transition shadow-lg group"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition">
              <MessageCircle size={24} />
            </div>
            <span className="text-sm font-bold text-white">Live Chat</span>
          </button>
          <a 
            href={`mailto:${supportSettings.email}`}
            className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-[#252a36] transition shadow-lg group"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition">
              <Mail size={24} />
            </div>
            <span className="text-sm font-bold text-white">Email Us</span>
          </a>
          <button 
            onClick={() => setActiveTab('tutorials')}
            className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-[#252a36] transition shadow-lg group"
          >
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition">
              <Video size={24} />
            </div>
            <span className="text-sm font-bold text-white">Tutorials</span>
          </button>
          <div className="bg-[#1e222d] p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-[#252a36] transition shadow-lg group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition">
              <Shield size={24} />
            </div>
            <span className="text-sm font-bold text-white">Security</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-[#1e222d] p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('faq')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition",
              activeTab === 'faq' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            )}
          >
            FAQs
          </button>
          <button 
            onClick={() => setActiveTab('tutorials')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition",
              activeTab === 'tutorials' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            )}
          >
            Tutorials
          </button>
          <button 
            onClick={() => setActiveTab('glossary')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition",
              activeTab === 'glossary' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            )}
          >
            Glossary
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'faq' && (
            <>
              <h2 className="text-xl font-bold text-white px-2">Frequently Asked Questions</h2>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((category, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">{category.category}</h3>
                    <div className="space-y-2">
                      {category.questions.map((faq, fIdx) => (
                        <div 
                          key={fIdx}
                          className="bg-[#1e222d] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition"
                        >
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {faq.q}
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-[#1e222d] rounded-3xl border border-dashed border-white/10">
                  <Search size={48} className="mx-auto text-gray-600 mb-4 opacity-20" />
                  <p className="text-gray-400">No results found for "{searchQuery}"</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tutorials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorials.map((video, idx) => (
                <a 
                  key={video.id || idx} 
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e222d] rounded-2xl overflow-hidden border border-white/5 group cursor-pointer"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={`https://picsum.photos/seed/${video.id || idx}/600/400`} 
                      alt={video.title} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
                        <Youtube size={24} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white mb-1">{video.title}</h4>
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{video.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><Activity size={12} /> {video.category}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {video.duration}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {activeTab === 'glossary' && (
            <div className="space-y-3">
              {glossary.map((item, idx) => (
                <div key={idx} className="bg-[#1e222d] p-4 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-blue-400 mb-1">{item.term}</h4>
                  <p className="text-sm text-gray-400">{item.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-center shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <h2 className="text-2xl font-black text-white mb-2 relative z-10">Join our Community</h2>
          <p className="text-blue-100 mb-6 relative z-10">Connect with thousands of traders worldwide and share strategies.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <a 
              href={supportSettings.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-blue-600 font-bold px-8 py-3 rounded-2xl hover:bg-blue-50 transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <Send size={18} /> Join Telegram
            </a>
            <button className="w-full sm:w-auto bg-blue-500/20 backdrop-blur-md text-white border border-white/20 font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition active:scale-95 flex items-center justify-center gap-2">
              <Globe size={18} /> Visit Website
            </button>
          </div>
        </div>

        {/* Footer Contact */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-xs">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><Phone size={14} /> +1 (800) ONYX-HELP</span>
            <span className="flex items-center gap-2"><Mail size={14} /> {supportSettings.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

