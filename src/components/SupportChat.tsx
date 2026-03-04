import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle, ChevronRight, Globe, Phone } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

// Initialize Gemini API
// Note: In a real production app, API calls should be proxied through a backend to protect the key.
// However, for this client-side demo as per instructions, we use the environment variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: number;
};

type Country = {
  id: string;
  name: string;
  language: string;
  flag: string;
  greeting: string;
};

const COUNTRIES: Country[] = [
  { 
    id: 'bd', 
    name: 'Bangladesh', 
    language: 'Bengali', 
    flag: '🇧🇩',
    greeting: 'OnyxTrade এ আপনাকে স্বাগতম! এটি বিশ্বের সবচেয়ে নিরাপদ এবং দ্রুততম ট্রেডিং প্ল্যাটফর্ম। আমাদের সাপোর্ট টিম ২৪/৭ আপনার পাশে আছে। আজ আপনাকে কিভাবে সাহায্য করতে পারি?'
  },
  { 
    id: 'in', 
    name: 'India', 
    language: 'Hindi', 
    flag: '🇮🇳',
    greeting: 'OnyxTrade में आपका स्वागत है! यह दुनिया का सबसे सुरक्षित और सबसे तेज़ ट्रेडिंग प्लेटफॉर्म है। हमारी सहायता टीम 24/7 आपके साथ है। आज हम आपकी कैसे मदद कर सकते हैं?'
  },
  { 
    id: 'pk', 
    name: 'Pakistan', 
    language: 'Urdu', 
    flag: '🇵🇰',
    greeting: 'OnyxTrade میں خوش آمدید! یہ دنیا کا سب سے محفوظ اور تیز ترین ٹریڈنگ پلیٹ فارم ہے۔ ہماری سپورٹ ٹیم 24/7 آپ کے ساتھ ہے۔ آج ہم آپ کی کیسے مدد کر سکتے ہیں؟'
  },
   { 
    id: 'id', 
    name: 'Indonesia', 
    language: 'Indonesian', 
    flag: '🇮🇩',
    greeting: 'Selamat datang di OnyxTrade! Ini adalah platform perdagangan teraman dan tercepat di dunia. Tim dukungan kami ada di sini untuk Anda 24/7. Bagaimana kami dapat membantu Anda hari ini?'
  },
  { 
    id: 'vn', 
    name: 'Vietnam', 
    language: 'Vietnamese', 
    flag: '🇻🇳',
    greeting: 'Chào mừng bạn đến với OnyxTrade! Đây là nền tảng giao dịch an toàn và nhanh nhất thế giới. Đội ngũ hỗ trợ của chúng tôi luôn bên bạn 24/7. Hôm nay chúng tôi có thể giúp gì cho bạn?'
  },
  { 
    id: 'br', 
    name: 'Brazil', 
    language: 'Portuguese', 
    flag: '🇧🇷',
    greeting: 'Bem-vindo ao OnyxTrade! Esta é a plataforma de negociação mais segura e rápida do mundo. Nossa equipe de suporte está aqui para você 24/7. Como podemos ajudá-lo hoje?'
  },
  { 
    id: 'global', 
    name: 'Global (English)', 
    language: 'English', 
    flag: '🌍',
    greeting: 'Welcome to OnyxTrade! This is the world\'s most secure and fastest trading platform. Our support team is here for you 24/7. How can we help you today?'
  },
];

interface SupportChatProps {
  onClose: () => void;
  supportSettings: { telegram: string; whatsapp: string; email: string };
}

export default function SupportChat({ onClose, supportSettings }: SupportChatProps) {
  const [chatStep, setChatStep] = useState<'country' | 'chat'>('country');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_REPLIES = [
    { id: 'verify', text: 'How to verify account?' },
    { id: 'deposit', text: 'Minimum deposit amount?' },
    { id: 'withdraw', text: 'Withdrawal time?' },
    { id: 'bonus', text: 'How to get bonuses?' },
  ];

  const handleQuickReply = (text: string) => {
    setInputText(text);
    // We'll trigger the send in the next tick or just call handleSendMessage with the text
    setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as any;
        handleSendMessage(text);
    }, 100);
  };

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDistance(dist);
      setInitialZoomLevel(zoomLevel);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistance;
      
      // "Super fast" zoom: amplify the gesture
      const delta = ratio - 1;
      const sensitivity = 3; // 3x sensitivity
      const newZoom = initialZoomLevel * (1 + delta * sensitivity);

      setZoomLevel(Math.min(Math.max(newZoom, 0.5), 3));
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDistance(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, chatStep]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setChatStep('chat');
    
    setMessages([
      {
        id: 'welcome',
        text: country.greeting,
        sender: 'support',
        timestamp: Date.now()
      }
    ]);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideText) setInputText('');
    setIsTyping(true);

    try {
      // Call Gemini API
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are a professional, highly skilled support agent for OnyxTrade, a premium trading platform. 
          Current Context: The user is from ${selectedCountry?.name} and speaks ${selectedCountry?.language}.
          Your goal is to assist users while professionally highlighting the strengths of OnyxTrade (fast withdrawals, 24/7 support, secure platform). 
          Tone: Professional, polite, persuasive, and trustworthy. 
          Language: You MUST reply in ${selectedCountry?.language}.
          Formatting: Do not use markdown (bold/italic). Use plain text only. Keep answers concise.`,
        },
        history: messages
          .filter(m => m.id !== 'welcome') // Exclude the static welcome message to ensure history starts with user
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
      });

      const result = await chat.sendMessage({ message: userMessage.text });
      const response = result.text;

      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response || "I apologize, I couldn't generate a response.",
        sender: 'support',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, supportMessage]);
    } catch (error) {
      console.error("Error getting support response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting to the support server right now. Please try again later.",
        sender: 'support',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#101114] flex flex-col h-full w-full md:max-w-md md:right-0 md:left-auto md:border-l md:border-white/10 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1e222d]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <MessageCircle size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e222d] rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-white">Onyx Support</h3>
            <p className="text-xs text-green-400 font-medium">Online</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-auto bg-[#101114] touch-pan-y select-none relative"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {chatStep === 'country' ? (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4">
                <Globe size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to OnyxTrade</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                The world's most trusted trading platform. Experience fast withdrawals and 24/7 premium support.
              </p>
              <p className="text-white font-medium pt-2">Please select your country to continue:</p>
            </div>
            
            <div className="space-y-3">
              {COUNTRIES.map((country) => (
                <motion.button
                  key={country.id}
                  onClick={() => handleCountrySelect(country)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-4 bg-[#1e222d] hover:bg-[#252a36] border border-white/5 hover:border-blue-500/30 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{country.flag}</span>
                    <div className="text-left">
                      <div className="text-white font-medium">{country.name}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{country.language}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">Or contact us directly</p>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href={supportSettings.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 bg-[#1e222d] rounded-2xl border border-white/5 hover:bg-[#252a36] transition group"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition">
                    <Send size={20} />
                  </div>
                  <span className="text-xs font-bold text-white">Telegram</span>
                </a>
                <a 
                  href={supportSettings.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 bg-[#1e222d] rounded-2xl border border-white/5 hover:bg-[#252a36] transition group"
                >
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition">
                    <Phone size={20} />
                  </div>
                  <span className="text-xs font-bold text-white">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 min-h-full flex flex-col justify-end">
             {/* Messages */}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex w-full",
                  msg.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed transition-all duration-75 ease-out",
                    msg.sender === 'user' 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-[#1e222d] text-gray-200 rounded-bl-none border border-white/5"
                  )}
                  style={{ 
                    fontSize: `${zoomLevel * 0.875}rem`,
                    lineHeight: `${zoomLevel * 1.4}rem`
                  }}
                >
                  {msg.text}
                  <div 
                    className={cn(
                      "mt-1 opacity-50 transition-all duration-75 ease-out",
                      msg.sender === 'user' ? "text-blue-100" : "text-gray-500"
                    )}
                    style={{ fontSize: `${zoomLevel * 0.625}rem` }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="bg-[#1e222d] rounded-2xl rounded-bl-none px-4 py-2 border border-white/5 flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs font-medium">
                    {selectedCountry?.id === 'bd' ? 'সাপোর্ট টাইপ করছে...' : 
                     selectedCountry?.id === 'in' ? 'सपोर्ट टाइप कर रहा है...' :
                     selectedCountry?.id === 'pk' ? 'سپورٹ ٹائپ کر رہا ہے...' :
                     selectedCountry?.id === 'id' ? 'Dukungan sedang mengetik...' :
                     selectedCountry?.id === 'vn' ? 'Hỗ trợ đang soạn tin...' :
                     selectedCountry?.id === 'br' ? 'Suporte está digitando...' :
                     'Support is typing...'}
                  </span>
                </div>
              </div>
            )}
            {/* Quick Replies */}
            {!isTyping && messages.length > 0 && messages[messages.length - 1].sender === 'support' && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReply(reply.text)}
                    className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition active:scale-95"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Only show in chat mode */}
      {chatStep === 'chat' && (
        <div className="p-4 bg-[#1e222d] border-t border-white/10">
          <div className="flex items-center gap-2 bg-[#101114] rounded-xl px-4 py-2 border border-white/5 focus-within:border-blue-500/50 transition">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
