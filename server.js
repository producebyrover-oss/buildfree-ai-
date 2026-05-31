// Backend Server for BuildFree.ai
// This is the "kitchen" behind your website

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

// Allow requests from your frontend
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE (JSON file for development)
// ============================================

const dbPath = path.join(__dirname, 'database.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({
    users: [],
    stores: [],
    orders: [],
    payments: []
  }, null, 2));
}

// Helper functions
function readDatabase() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function writeDatabase(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ============================================
// 1. USER REGISTRATION & LOGIN
// ============================================

app.post('/api/register', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const db = readDatabase();

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = {
    id: Date.now().toString(),
    email,
    password, // ⚠️ Hash this in production!
    fullName,
    plan: 'free',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDatabase(db);

  res.json({
    success: true,
    message: 'Account created! Welcome to BuildFree.ai 💚',
    user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    success: true,
    message: 'Login successful!',
    user: { id: user.id, email: user.email, fullName: user.fullName, plan: user.plan }
  });
});

// ============================================
// 2. PAYSTACK PAYMENT INTEGRATION
// ============================================

app.post('/api/payment/initialize', (req, res) => {
  const { email, amount, plan } = req.body;

  if (!email || !amount || !plan) {
    return res.status(400).json({ error: 'Email, amount, and plan required' });
  }

  const paystackUrl = 'https://api.paystack.co/transaction/initialize';
  
  const payload = {
    email: email,
    amount: amount * 100, // Paystack uses kobo
    metadata: {
      plan: plan,
      userType: 'customer'
    }
  };

  axios.post(paystackUrl, payload, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  })
  .then(response => {
    const db = readDatabase();
    db.payments.push({
      id: response.data.data.reference,
      email,
      amount,
      plan,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    writeDatabase(db);

    res.json({
      success: true,
      checkoutUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  })
  .catch(error => {
    console.error('Paystack Error:', error.response?.data);
    res.status(500).json({ error: 'Payment initialization failed' });
  });
});

app.post('/api/payment/verify', (req, res) => {
  const { reference, email } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference required' });
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;

  axios.get(verifyUrl, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  })
  .then(response => {
    if (response.data.data.status === 'success') {
      const db = readDatabase();
      const user = db.users.find(u => u.email === email);
      
      if (user) {
        user.plan = 'pro';
        user.proActivatedAt = new Date().toISOString();
        writeDatabase(db);
      }

      res.json({
        success: true,
        message: 'Payment verified! Your Pro account is now active',
        plan: 'pro'
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  })
  .catch(error => {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Could not verify payment' });
  });
});

// ============================================
// 3. STORE CREATION
// ============================================

app.post('/api/stores/create', (req, res) => {
  const { userId, storeName, niche, storeUrl } = req.body;

  if (!userId || !storeName || !niche || !storeUrl) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const db = readDatabase();

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (db.stores.find(s => s.storeUrl === storeUrl)) {
    return res.status(400).json({ error: 'Store URL already taken' });
  }

  const newStore = {
    id: Date.now().toString(),
    userId,
    storeName,
    niche,
    storeUrl,
    products: [],
    theme: 'dark',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.stores.push(newStore);
  writeDatabase(db);

  res.json({
    success: true,
    message: 'Store created successfully!',
    store: {
      id: newStore.id,
      storeUrl: `https://buildfree.ai/stores/${newStore.storeUrl}`,
      storeName: newStore.storeName,
      niche: newStore.niche
    }
  });
});

app.get('/api/stores/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDatabase();
  const userStores = db.stores.filter(s => s.userId === userId);

  if (userStores.length === 0) {
    return res.json({ stores: [], message: 'No stores created yet' });
  }

  res.json({ stores: userStores });
});

// ============================================
// 4. AI PRODUCT SELECTION
// ============================================

app.post('/api/products/auto-select', (req, res) => {
  const { storeId, niche } = req.body;

  if (!storeId || !niche) {
    return res.status(400).json({ error: 'Store ID and niche required' });
  }

  const mockProducts = [
    {
      id: 1,
      name: `Premium ${niche} Product #1`,
      price: 299,
      supplier: 'CJ Dropshipping',
      image: 'https://via.placeholder.com/300',
      rating: 4.8
    },
    {
      id: 2,
      name: `Best-Seller ${niche} Item #2`,
      price: 199,
      supplier: 'AliExpress',
      image: 'https://via.placeholder.com/300',
      rating: 4.6
    },
    {
      id: 3,
      name: `Trending ${niche} Collection #3`,
      price: 399,
      supplier: 'Tradelle',
      image: 'https://via.placeholder.com/300',
      rating: 4.9
    }
  ];

  const db = readDatabase();
  const store = db.stores.find(s => s.id === storeId);
  
  if (store) {
    store.products = mockProducts;
    writeDatabase(db);
  }

  res.json({
    success: true,
    message: 'AI has selected winning products for your store!',
    products: mockProducts
  });
});

// ============================================
// 5. AI VIDEO GENERATION
// ============================================

app.post('/api/videos/generate', (req, res) => {
  const { productId, storeId } = req.body;

  if (!productId || !storeId) {
    return res.status(400).json({ error: 'Product ID and Store ID required' });
  }

  res.json({
    success: true,
    message: 'AI is generating your video... This takes 2-3 minutes',
    videoStatus: 'processing',
    videoId: Date.now().toString(),
    estimatedTime: '2-3 minutes'
  });
});

// ============================================
// 6. BASIC ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running! ✅' });
});

app.get('/api/stats', (req, res) => {
  const db = readDatabase();
  res.json({
    totalUsers: db.users.length,
    totalStores: db.stores.length,
    totalOrders: db.orders.length,
    totalRevenue: db.payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0)
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BuildFree.ai Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});
