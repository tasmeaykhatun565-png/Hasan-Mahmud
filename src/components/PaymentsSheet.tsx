import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight, 
  History, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Smartphone,
  Bitcoin
} from 'lucide-react';
import BottomSheet from './BottomSheet';
import DepositFlow from './DepositFlow';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface PaymentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  activeAccount: 'REAL' | 'DEMO';
}

const RECENT_TRANSACTIONS = [
  { id: 1, type: 'DEPOSIT', method: 'bKash', amount: 3600, date: 'Mar 1, 2026', status: 'SUCCESS' },
  { id: 2, type: 'WITHDRAW', method: 'Nagad', amount: 1200, date: 'Feb 28, 2026', status: 'PENDING' },
  { id: 3, type: 'DEPOSIT', method: 'BinancePay', amount: 12000, date: 'Feb 25, 2026', status: 'SUCCESS' },
];

export default function PaymentsSheet({ isOpen, onClose, balance, activeAccount }: PaymentsSheetProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center justify-center py-2">
            <h2 className="text-[var(--text-primary)] font-bold text-lg">Payments</h2>
          </div>
          
          <div className="space-y-3">
            {/* Deposit Button - Green & Prominent */}
            <button 
              onClick={() => setIsDepositOpen(true)}
              className="w-full bg-[#34ff34] hover:bg-[#2ce62c] active:scale-[0.98] transition-all rounded-2xl py-5 px-6 flex items-center justify-center gap-4 text-black font-bold text-lg shadow-[0_4px_12px_rgba(52,255,52,0.2)]"
            >
              <Wallet size={24} strokeWidth={2.5} />
              <span>Deposit</span>
            </button>
            
            <button className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all rounded-2xl py-5 px-6 flex items-center justify-center gap-4 text-[var(--text-primary)] font-bold text-lg border border-[var(--border-color)]">
              <ArrowUp size={24} className="text-[var(--text-primary)]" />
              <span>Withdraw</span>
            </button>

            <button className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all rounded-2xl py-5 px-6 flex items-center justify-center gap-4 text-[var(--text-primary)] font-bold text-lg border border-[var(--border-color)]">
              <ArrowLeftRight size={24} className="text-[var(--text-primary)]" />
              <span>Internal Transfer</span>
            </button>

            <button className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all rounded-2xl py-5 px-6 flex items-center justify-center gap-4 text-[var(--text-primary)] font-bold text-lg border border-[var(--border-color)]">
              <History size={24} className="text-[var(--text-primary)]" />
              <span>Transactions</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      <AnimatePresence>
        {isDepositOpen && (
          <DepositFlow 
            isOpen={isDepositOpen} 
            onClose={() => setIsDepositOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
