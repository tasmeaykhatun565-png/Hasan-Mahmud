import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Wallet, 
  Lock, 
  Check, 
  Search,
  CreditCard,
  Bitcoin,
  Smartphone,
  Banknote,
  Percent,
  Info,
  Copy,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface DepositFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'PAYMENT_METHOD' | 'AMOUNT' | 'PROMO_CODE' | 'PAYMENT_DETAILS' | 'CONFIRMATION';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'POPULAR' | 'E-PAY' | 'CRYPTO';
  minAmount: string;
  isPopular?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'binance_pay', name: 'Binance Pay', icon: <div className="w-8 h-8 bg-[#f3ba2f] rounded-full flex items-center justify-center text-[12px] font-bold text-black">B</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'bkash_p2c', name: 'Bkash (P2C)', icon: <div className="w-8 h-8 bg-[#e2136e] rounded flex items-center justify-center text-[12px] font-bold text-white">b</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'nagad_p2c', name: 'Nagad (P2C)', icon: <div className="w-8 h-8 bg-[#f7941d] rounded flex items-center justify-center text-[12px] font-bold text-white">N</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdt_bep20', name: 'USDT (BEP-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdt_trc20', name: 'USDT (TRC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdc_bep20', name: 'USDC (BEP-20)', icon: <div className="w-8 h-8 bg-[#2775ca] rounded-full flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'dogecoin', name: 'Dogecoin', icon: <div className="w-8 h-8 bg-[#c2a633] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'POPULAR', minAmount: '$15.00', isPopular: true },
  { id: 'usdt_polygon', name: 'USDT (Polygon)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  
  { id: 'bkash_e', name: 'Bkash (P2C)', icon: <div className="w-8 h-8 bg-[#e2136e] rounded flex items-center justify-center text-[12px] font-bold text-white">b</div>, category: 'E-PAY', minAmount: '$10.00' },
  { id: 'nagad_e', name: 'Nagad (P2C)', icon: <div className="w-8 h-8 bg-[#f7941d] rounded flex items-center justify-center text-[12px] font-bold text-white">N</div>, category: 'E-PAY', minAmount: '$10.00' },
  
  { id: 'binance_pay_c', name: 'Binance Pay', icon: <div className="w-8 h-8 bg-[#f3ba2f] rounded-full flex items-center justify-center text-[12px] font-bold text-black">B</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_trc20_c', name: 'USDT (TRC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: <div className="w-8 h-8 bg-[#f7931a] rounded-full flex items-center justify-center text-[12px] font-bold text-white">B</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'ethereum', name: 'Ethereum (ETH)', icon: <div className="w-8 h-8 bg-[#627eea] rounded-full flex items-center justify-center text-[12px] font-bold text-white">E</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'litecoin', name: 'Litecoin (LTC)', icon: <div className="w-8 h-8 bg-[#345d9d] rounded-full flex items-center justify-center text-[12px] font-bold text-white">L</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_erc20_c', name: 'USDT (ERC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_polygon_c', name: 'USDT (Polygon)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdc_erc20_c', name: 'USDC (ERC-20)', icon: <div className="w-8 h-8 bg-[#2775ca] rounded-full flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'bitcoin_cash', name: 'Bitcoin Cash', icon: <div className="w-8 h-8 bg-[#8dc351] rounded-full flex items-center justify-center text-[12px] font-bold text-white">B</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'tron', name: 'Tron (TRX)', icon: <div className="w-8 h-8 bg-[#ef0027] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'dash', name: 'Dash', icon: <div className="w-8 h-8 bg-[#008ce7] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'polygon', name: 'Polygon (MATIC)', icon: <div className="w-8 h-8 bg-[#8247e5] rounded-full flex items-center justify-center text-[12px] font-bold text-white">P</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'dai', name: 'Dai', icon: <div className="w-8 h-8 bg-[#f5ac37] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'solana', name: 'Solana', icon: <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[12px] font-bold text-white">S</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'shiba_inu', name: 'Shiba Inu (ERC-20)', icon: <div className="w-8 h-8 bg-[#ffa409] rounded-full flex items-center justify-center text-[12px] font-bold text-white">S</div>, category: 'CRYPTO', minAmount: '$100.00' },
  { id: 'ripple', name: 'Ripple', icon: <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[12px] font-bold text-white">R</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'ton', name: 'The Open Network (TON)', icon: <div className="w-8 h-8 bg-[#0088cc] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$15.00' },
];

const PRESET_AMOUNTS = [10, 20, 50, 100, 250, 500];

const PROMO_CODES = [
  { code: 'LUNAR2026', description: 'Use LUNAR2026 when depositing $10+', bonus: '110%', expires: 'Mar 9' },
  { code: 'UE5QMQZ0E8', description: 'Use UE5QMQZ0E8 when depositing $250+', bonus: 'UP TO 100%', expires: 'Mar 9', title: 'Advanced Status' },
  { code: 'ONPAY', description: 'Use ONPAY when depositing $15+', bonus: 'UP TO 100%', expires: 'Mar 13', title: 'Deposit Bonus' },
];

export default function DepositFlow({ isOpen, onClose }: DepositFlowProps) {
  const [step, setStep] = useState<Step>('PAYMENT_METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState<number>(10);
  const [selectedPromo, setSelectedPromo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'POPULAR' | 'E-PAY' | 'CRYPTO'>('POPULAR');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depositStatus, setDepositStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  if (!isOpen) return null;

  const handleBack = () => {
    if (step === 'PAYMENT_METHOD') onClose();
    else if (step === 'CONFIRMATION') onClose();
    else if (step === 'AMOUNT') setStep('PAYMENT_METHOD');
    else if (step === 'PAYMENT_DETAILS') setStep('AMOUNT');
    else setStep('PAYMENT_METHOD');
  };

  const handleSubmitDeposit = () => {
    if (!transactionId) return;
    
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setDepositStatus('PENDING');
      setStep('CONFIRMATION');
    }, 2000);
  };

  const renderPaymentMethods = () => {
    const categories: ('POPULAR' | 'E-PAY' | 'CRYPTO')[] = ['POPULAR', 'E-PAY', 'CRYPTO'];
    
    const popularMethods = PAYMENT_METHODS.filter(m => m.isPopular);
    const epayMethods = PAYMENT_METHODS.filter(m => m.category === 'E-PAY');
    const cryptoMethods = PAYMENT_METHODS.filter(m => m.category === 'CRYPTO');

    const filteredMethods = activeCategory === 'POPULAR' 
      ? popularMethods 
      : activeCategory === 'E-PAY' 
        ? epayMethods 
        : cryptoMethods;

    return (
      <div className="flex flex-col h-full bg-[#1e222d]">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Deposit</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex bg-[#101114] p-1 rounded-xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-1 py-3 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center gap-1",
                  activeCategory === cat ? "bg-[#2a2e39] text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {cat === 'POPULAR' && <div className="w-2 h-2 rounded-full bg-red-500 mb-1" />}
                {cat === 'E-PAY' && <Wallet size={14} className="mb-1" />}
                {cat === 'CRYPTO' && <div className="w-3 h-3 bg-gray-400 rotate-45 mb-1" />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          {activeCategory === 'POPULAR' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white px-1">Popular in your region ({popularMethods.length})</h3>
              <div className="space-y-2">
                {popularMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setStep('AMOUNT');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl transition active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">{method.name}</div>
                        <div className="text-[10px] text-gray-400">Min. {method.minAmount}</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeCategory === 'POPULAR' || activeCategory === 'E-PAY') && epayMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white px-1">E-Pay ({epayMethods.length})</h3>
              <div className="space-y-2">
                {epayMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setStep('AMOUNT');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl transition active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">{method.name}</div>
                        <div className="text-[10px] text-gray-400">Min. {method.minAmount}</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeCategory === 'POPULAR' || activeCategory === 'CRYPTO') && cryptoMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white px-1">Crypto ({cryptoMethods.length})</h3>
              <div className="space-y-2">
                {cryptoMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setStep('AMOUNT');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl transition active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">{method.name}</div>
                        <div className="text-[10px] text-gray-400">Min. {method.minAmount}</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAmount = () => (
    <div className="flex flex-col h-full bg-[#1e222d]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Deposit Amount</h2>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-[#101114] rounded-2xl p-4 border border-white/5 focus-within:border-[#22c55e]/50 transition">
          <div className="text-xs text-gray-500 font-medium mb-1">Amount, USD</div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white">$</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map(val => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={cn(
                "p-4 rounded-xl border transition font-bold text-sm",
                amount === val ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]" : "bg-[#101114] border-white/5 text-gray-400"
              )}
            >
              ${val.toLocaleString()}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setStep('PAYMENT_DETAILS')}
          className="w-full bg-[#22c55e] text-black font-black py-4 rounded-2xl mt-4 hover:bg-[#22c55e]/90 transition active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const renderPromoCode = () => (
    <div className="flex flex-col h-full bg-[#1e222d]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-white">Choose Promo Code</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {PROMO_CODES.map((promo, idx) => (
          <div key={idx} className="bg-[#101114] rounded-2xl border border-white/5 overflow-hidden active:scale-[0.99] transition">
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Expires on {promo.expires}</div>
                  <h3 className="text-lg font-bold text-white">{promo.title || 'Promo Code'}</h3>
                </div>
                <div className="w-12 h-12 bg-[#22c55e]/10 rounded-xl flex items-center justify-center text-[#22c55e] font-black text-[10px] rotate-12 border border-[#22c55e]/20">
                  {promo.bonus}
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {promo.description} <Info size={12} className="inline ml-1" />
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedPromo(promo.code);
                setStep('PAYMENT_METHOD');
              }}
              className="w-full bg-white/5 py-3 text-[#22c55e] font-bold text-sm hover:bg-white/10 transition border-t border-white/5"
            >
              Apply Promo Code
            </button>
          </div>
        ))}

        <button className="w-full bg-[#101114] rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition text-white">
          <span className="text-sm font-bold">Enter Promo Code</span>
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>
    </div>
  );

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy using clipboard API: ', err);
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

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

  const renderPaymentDetails = () => (
    <div className="flex flex-col h-full bg-[#1e222d]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Payment Details</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-[#101114] rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
              {selectedMethod.icon}
            </div>
            <h3 className="text-lg font-bold text-white">Send ${amount.toLocaleString()}</h3>
            <p className="text-xs text-gray-500">Please send the exact amount to the account below</p>
          </div>

          <div className="bg-black/40 rounded-xl p-4 flex items-center justify-between border border-white/5">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Merchant Account</div>
              <div className="text-lg font-mono font-bold text-white tracking-wider">01712-345678</div>
            </div>
            <button 
              onClick={() => handleCopy('01712-345678')}
              className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition active:scale-90 relative"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={18} className="text-[#22c55e]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy size={18} className="text-[#22c55e]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-yellow-500 shrink-0" />
            <p className="text-[10px] text-yellow-500/80 leading-relaxed">
              Ensure you include your account ID in the reference if required. Deposits usually reflect within 5-15 minutes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#101114] rounded-2xl p-4 border border-white/5 focus-within:border-[#22c55e]/50 transition">
            <div className="text-xs text-gray-500 font-medium mb-1">Transaction ID / Reference</div>
            <input 
              type="text" 
              placeholder="Enter 10-digit ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-white focus:outline-none placeholder:text-gray-700"
            />
          </div>

          <button 
            disabled={!transactionId || isProcessing}
            onClick={handleSubmitDeposit}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2",
              transactionId && !isProcessing 
                ? "bg-[#22c55e] text-black shadow-[0_8px_24px_rgba(34,197,94,0.2)] active:scale-[0.98]" 
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Deposit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-6 bg-[#1e222d]">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-[#22c55e]/10 flex items-center justify-center border-2 border-[#22c55e]/20"
      >
        <Clock size={48} className="text-[#22c55e] animate-pulse" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Deposit Pending</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
          We've received your request for ${amount.toLocaleString()}. Our team is verifying the transaction.
        </p>
      </div>

      <div className="w-full bg-[#101114] rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Transaction ID</span>
          <span className="text-white font-mono font-bold">{transactionId}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Method</span>
          <span className="text-white font-bold">{selectedMethod.name}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Estimated Time</span>
          <span className="text-[#22c55e] font-bold">5-15 Minutes</span>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition active:scale-[0.98]"
      >
        Back to Trading
      </button>
    </div>
  );

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#101114] flex flex-col"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {step === 'PAYMENT_METHOD' && renderPaymentMethods()}
          {step === 'AMOUNT' && renderAmount()}
          {step === 'PROMO_CODE' && renderPromoCode()}
          {step === 'PAYMENT_DETAILS' && renderPaymentDetails()}
          {step === 'CONFIRMATION' && renderConfirmation()}
        </motion.div>
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[#1e222d] p-8 rounded-3xl border border-white/10 flex flex-col items-center space-y-4">
              <Loader2 size={40} className="text-[#22c55e] animate-spin" />
              <p className="text-white font-bold">Processing Deposit...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
