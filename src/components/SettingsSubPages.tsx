import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Image, Activity, Bell, Check, 
  Volume2, VolumeX, Moon, Sun, Monitor, Globe,
  MousePointer2, ShieldCheck, Zap, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useTranslation, languages, Language } from '../lib/i18n';

interface SubPageProps {
  onBack: () => void;
}

export const TradingPlatformSettings: React.FC<SubPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [oneClick, setOneClick] = useState(true);
  const [confirmTrade, setConfirmTrade] = useState(false);
  const [highPerformance, setHighPerformance] = useState(true);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-[var(--bg-primary)] z-[60] flex flex-col"
    >
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-primary)] hover:bg-white/10 p-1 rounded-full transition">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('nav.terminal')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trading Mode</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <ToggleItem 
              icon={<Zap size={20} className="text-yellow-500" />} 
              label="One-Click Trading" 
              description="Open trades instantly without confirmation"
              enabled={oneClick}
              onToggle={() => setOneClick(!oneClick)}
            />
            <ToggleItem 
              icon={<ShieldCheck size={20} className="text-blue-500" />} 
              label="Confirm Trades" 
              description="Ask for confirmation before opening a trade"
              enabled={confirmTrade}
              onToggle={() => setConfirmTrade(!confirmTrade)}
              isLast
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <ToggleItem 
              icon={<Activity size={20} className="text-green-500" />} 
              label="High Performance Mode" 
              description="Smoother chart rendering (uses more battery)"
              enabled={highPerformance}
              onToggle={() => setHighPerformance(!highPerformance)}
              isLast
            />
          </div>
        </section>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
          <AlertCircle className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Trading platform settings are synchronized across all your devices. 
            Changes made here will take effect immediately.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const AppearanceSettings: React.FC<SubPageProps & { timezoneOffset?: number, setTimezoneOffset?: (v: number) => void }> = ({ onBack, timezoneOffset = 0, setTimezoneOffset }) => {
  const { t, language, setLanguage } = useTranslation();
  const [theme, setTheme] = useState<string>(localStorage.getItem('app-theme') || 'dark');
  const [sound, setSound] = useState(true);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const timezones = [
    { label: 'UTC (GMT)', offset: 0 },
    { label: 'London (UTC+0)', offset: 0 },
    { label: 'Berlin (UTC+1)', offset: 1 },
    { label: 'Cairo (UTC+2)', offset: 2 },
    { label: 'Moscow (UTC+3)', offset: 3 },
    { label: 'Dubai (UTC+4)', offset: 4 },
    { label: 'Karachi (UTC+5)', offset: 5 },
    { label: 'India (UTC+5:30)', offset: 5.5 },
    { label: 'Dhaka/Bangladesh (UTC+6)', offset: 6 },
    { label: 'Bangladesh (Custom UTC+6:30)', offset: 6.5 },
    { label: 'Myanmar (UTC+6:30)', offset: 6.5 },
    { label: 'Bangkok (UTC+7)', offset: 7 },
    { label: 'Hong Kong (UTC+8)', offset: 8 },
    { label: 'Tokyo (UTC+9)', offset: 9 },
    { label: 'Sydney (UTC+10)', offset: 10 },
    { label: 'New York (UTC-5)', offset: -5 },
    { label: 'Chicago (UTC-6)', offset: -6 },
    { label: 'Los Angeles (UTC-8)', offset: -8 },
  ];

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-[var(--bg-primary)] z-[60] flex flex-col"
    >
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-primary)] hover:bg-white/10 p-1 rounded-full transition">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('settings.appearance')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('settings.appearance')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ThemeButton 
              active={theme === 'dark'} 
              onClick={() => handleThemeChange('dark')}
              icon={<Moon size={20} />}
              label="Dark"
              color="#101114"
            />
            <ThemeButton 
              active={theme === 'light'} 
              onClick={() => handleThemeChange('light')}
              icon={<Sun size={20} />}
              label="Light"
              color="#f3f4f6"
            />
            <ThemeButton 
              active={theme === 'onyx'} 
              onClick={() => handleThemeChange('onyx')}
              icon={<ShieldCheck size={20} />}
              label="Onyx"
              color="#000000"
            />
            <ThemeButton 
              active={theme === 'midnight'} 
              onClick={() => handleThemeChange('midnight')}
              icon={<Monitor size={20} />}
              label="Midnight"
              color="#020617"
            />
            <ThemeButton 
              active={theme === 'emerald'} 
              onClick={() => handleThemeChange('emerald')}
              icon={<Activity size={20} />}
              label="Emerald"
              color="#022c22"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Timezone (Chart Time)</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Select Timezone</span>
              </div>
              <select 
                value={timezoneOffset}
                onChange={(e) => setTimezoneOffset?.(Number(e.target.value))}
                className="bg-[var(--bg-tertiary)] text-sm font-bold text-blue-500 focus:outline-none p-2 rounded-lg border border-[var(--border-color)]"
              >
                {timezones.map((tz) => (
                  <option key={tz.label} value={tz.offset}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 px-1">This will adjust the time displayed on the trading chart axis.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Sound Effects</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            <ToggleItem 
              icon={sound ? <Volume2 size={20} className="text-blue-500" /> : <VolumeX size={20} className="text-gray-500" />} 
              label="Enable Sounds" 
              description="Play sounds for trade results and interactions"
              enabled={sound}
              onToggle={() => setSound(!sound)}
              isLast
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('settings.language')}</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">{t('settings.language')}</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-[var(--bg-tertiary)] text-sm font-bold text-blue-500 focus:outline-none p-2 rounded-lg border border-[var(--border-color)]"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export const NotificationSettings: React.FC<SubPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [tradeResults, setTradeResults] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-[var(--bg-primary)] z-[60] flex flex-col"
    >
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-primary)] hover:bg-white/10 p-1 rounded-full transition">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('settings.notifications')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Push Notifications</h2>
          <div className="bg-[#1e222d] rounded-xl overflow-hidden border border-white/5">
            <ToggleItem 
              icon={<Activity size={20} className="text-green-500" />} 
              label="Trade Results" 
              description="Get notified when your trades close"
              enabled={tradeResults}
              onToggle={() => setTradeResults(!tradeResults)}
            />
            <ToggleItem 
              icon={<Zap size={20} className="text-yellow-500" />} 
              label="Price Alerts" 
              description="Notifications for your set price levels"
              enabled={priceAlerts}
              onToggle={() => setPriceAlerts(!priceAlerts)}
            />
            <ToggleItem 
              icon={<Bell size={20} className="text-blue-500" />} 
              label="Marketing & News" 
              description="Stay updated with platform news and promos"
              enabled={marketing}
              onToggle={() => setMarketing(!marketing)}
              isLast
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
};

// --- Helper Components ---

const ToggleItem = ({ 
  icon, label, description, enabled, onToggle, isLast 
}: { 
  icon: React.ReactNode, label: string, description: string, enabled: boolean, onToggle: () => void, isLast?: boolean 
}) => (
  <div className={cn(
    "p-4 flex items-center justify-between",
    !isLast && "border-b border-[var(--border-color)]"
  )}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{label}</h3>
        <p className="text-[10px] text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={cn(
        "w-10 h-5 rounded-full relative transition-colors duration-200",
        enabled ? "bg-blue-500" : "bg-gray-700"
      )}
    >
      <div className={cn(
        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200",
        enabled ? "left-6" : "left-1"
      )} />
    </button>
  </div>
);

const ThemeButton = ({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition active:scale-95 relative overflow-hidden",
      active ? "border-blue-500 ring-1 ring-blue-500" : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
    )}
  >
    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
    <div className={cn(
      "p-2 rounded-full",
      active ? "bg-blue-500/20 text-blue-500" : "bg-white/5 text-[var(--text-secondary)]"
    )}>
      {icon}
    </div>
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider",
      active ? "text-blue-500" : "text-[var(--text-secondary)]"
    )}>{label}</span>
    {active && (
      <div className="absolute top-2 right-2">
        <div className="bg-blue-500 rounded-full p-0.5">
          <Check size={10} className="text-white" />
        </div>
      </div>
    )}
  </button>
);
