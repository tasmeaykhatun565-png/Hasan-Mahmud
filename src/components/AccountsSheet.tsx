import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, MoreVertical, Check, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface AccountsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  activeAccount: 'DEMO' | 'REAL';
  onSelectAccount: (type: 'DEMO' | 'REAL') => void;
  onRefill: () => void;
}

export default function AccountsSheet({ 
  isOpen, 
  onClose, 
  balance,
  activeAccount,
  onSelectAccount,
  onRefill
}: AccountsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)] rounded-t-[20px] overflow-hidden border-t border-[var(--border-color)] pb-safe"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[var(--text-secondary)]/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 text-center relative">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Accounts</h2>
            </div>

            {/* Content */}
            <div className="px-4 pb-8 space-y-3">
              
              {/* Demo Account Item */}
              <div 
                onClick={() => {
                  onSelectAccount('DEMO');
                  onClose();
                }}
                className={cn(
                  "bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between border transition active:scale-[0.98]",
                  activeAccount === 'DEMO' ? "border-[#ff9f43]/50 bg-[var(--bg-secondary)]" : "border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff9f43] flex items-center justify-center text-[#101114] font-bold text-xl">
                    Đ
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[var(--text-primary)] font-medium text-sm">Demo account</span>
                    <span className="text-[var(--text-secondary)] text-sm">
                      Đ{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeAccount === 'DEMO' && (
                    <div className="w-5 h-5 rounded-full bg-[#ff9f43] flex items-center justify-center">
                      <Check size={12} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefill();
                    }}
                    className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full text-[#ff9f43] transition active:rotate-180"
                    title="Refill Balance"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              {/* Real Account Item (BDT) */}
              <div 
                onClick={() => {
                  onSelectAccount('REAL');
                  onClose();
                }}
                className={cn(
                  "bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between border transition active:scale-[0.98]",
                  activeAccount === 'REAL' ? "border-[#22c55e]/50 bg-[var(--bg-secondary)]" : "border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#006a4e] flex items-center justify-center relative overflow-hidden">
                    <div className="w-4 h-4 bg-[#f42a41] rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[var(--text-primary)] font-medium text-sm">BDT Account</span>
                    <span className="text-[var(--text-secondary)] text-sm">BDT 0.00</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {activeAccount === 'REAL' && (
                        <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                            <Check size={12} className="text-black" strokeWidth={3} />
                        </div>
                    )}
                    <button className="p-1 hover:bg-[var(--text-primary)]/10 rounded-full text-[var(--text-secondary)]">
                        <MoreVertical size={20} />
                    </button>
                </div>
              </div>

              {/* Add Account Button */}
              <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--text-primary)]/5 transition text-[var(--text-primary)] font-medium mt-2">
                <Plus size={24} />
                <span>Add Account</span>
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
