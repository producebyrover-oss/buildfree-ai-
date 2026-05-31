# BuildFree.ai Backend Setup Guide

## 📚 What Each File Does

### `server.js`
This is your **backend engine**. It handles:
- 👤 User registration & login
- 💳 Paystack payment processing
- 🏪 Store creation
- 🤖 AI product selection
- 🎬 AI video generation

### `package.json`
Lists all the **tools/libraries** your backend needs:
- `express` - Web server framework
- `cors` - Allows frontend to talk to backend
- `axios` - Makes HTTP requests to APIs
- `dotenv` - Loads secret keys securely

### `.env` file
Stores your **secret keys**:
- Your Paystack API key
- Server port
- Environment (development/production)

---

## 🚀 Quick Start

### Step 1: Install Node.js
Download from https://nodejs.org/ (LTS version)

### Step 2: Clone the repository
```bash
git clone https://github.com/producebyrover-oss/buildfree-ai-.git
cd buildfree-ai-
git checkout backend-setup
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Create `.env` file
Copy `.env.example` and rename to `.env`, then add your Paystack key:
```
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PORT=5000
NODE_ENV=development
```

### Step 5: Start the Server
```bash
npm start
```

You should see:
```
🚀 BuildFree.ai Backend running on http://localhost:5000
```

---

## 🔌 API Endpoints

### **Authentication**

#### Register User
```
POST /api/register
Body: { email, password, fullName }
Response: { success: true, user: {...} }
```

#### Login User
```
POST /api/login
Body: { email, password }
Response: { success: true, user: {...} }
```

---

### **Payments (Paystack)**

#### Initialize Payment
```
POST /api/payment/initialize
Body: { email, amount, plan }
Response: { checkoutUrl: "https://checkout.paystack.com/...", reference: "..." }
```

#### Verify Payment
```
POST /api/payment/verify
Body: { reference, email }
Response: { success: true, plan: "pro" }
```

---

### **Store Management**

#### Create Store
```
POST /api/stores/create
Body: { userId, storeName, niche, storeUrl }
Response: { success: true, store: {...} }
```

#### Get User's Stores
```
GET /api/stores/:userId
Response: { stores: [...] }
```

---

### **Products**

#### Auto-Select Products
```
POST /api/products/auto-select
Body: { storeId, niche }
Response: { success: true, products: [...] }
```

---

### **Videos**

#### Generate AI Video
```
POST /api/videos/generate
Body: { productId, storeId }
Response: { success: true, videoStatus: "processing", videoId: "..." }
```

---

### **Health Check**

#### Check if Backend is Running
```
GET /api/health
Response: { status: "Backend is running! ✅" }
```

#### Get Statistics
```
GET /api/stats
Response: { totalUsers: 5, totalStores: 10, totalRevenue: 2495 }
```

---

## 💳 Payment Flow Explained

1. User clicks **"Upgrade to Pro"**
2. Frontend sends email, amount (R499), plan to backend
3. Backend calls **Paystack API** to initialize payment
4. Paystack returns a **checkout URL**
5. User is redirected to **secure Paystack checkout page**
6. User enters card details on Paystack (your backend NEVER sees the card)
7. Payment successful → Paystack confirms with your backend
8. Backend updates user plan to **"pro"**
9. User gains access to unlimited features

---

## 🏪 Store Creation Flow

1. User enters: Store name, Niche, URL slug
2. Backend checks if URL is unique
3. Backend creates store in database
4. Backend auto-selects 10 products for that niche
5. User gets their unique store URL
6. User can customize products, colors, theme

---

## 📊 Database Structure

Uses `database.json` (for development):

```json
{
  "users": [
    {
      "id": "1234567890",
      "email": "user@example.com",
      "fullName": "John Doe",
      "plan": "free",
      "createdAt": "2026-05-31T10:00:00Z"
    }
  ],
  "stores": [
    {
      "id": "0987654321",
      "userId": "1234567890",
      "storeName": "My Store",
      "niche": "tech gadgets",
      "storeUrl": "my-store",
      "products": [],
      "status": "active",
      "createdAt": "2026-05-31T11:00:00Z"
    }
  ],
  "payments": [
    {
      "id": "paystack_ref_123",
      "email": "user@example.com",
      "amount": 499,
      "plan": "pro",
      "status": "success",
      "createdAt": "2026-05-31T12:00:00Z"
    }
  ]
}
```

---

## 🔒 Security Notes (Important!)

This is a **development version**. Before production:

1. **Hash passwords** - Use bcrypt
2. **Use real database** - MongoDB or PostgreSQL (not JSON files)
3. **Add JWT authentication** - For secure sessions
4. **Enable HTTPS** - Always use HTTPS in production
5. **Validate all inputs** - Prevent attacks
6. **Keep secrets safe** - Never commit `.env` file

---

## ✅ Testing Commands

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","fullName":"Test User"}'
```

### Test Store Creation
```bash
curl -X POST http://localhost:5000/api/stores/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"1234567890","storeName":"My Store","niche":"gadgets","storeUrl":"my-store"}'
```

---

## 📞 Next Steps

- [ ] Get Paystack account at https://paystack.com
- [ ] Extract your Secret Key
- [ ] Create `.env` file with key
- [ ] Run `npm install`
- [ ] Run `npm start`
- [ ] Test endpoints with curl
- [ ] Connect frontend to backend
- [ ] Deploy to production

---

## 🆘 Troubleshooting

**"Cannot find module 'express'"**
→ Run: `npm install`

**"PAYSTACK_SECRET_KEY is undefined"**
→ Create `.env` file with your key

**"Port 5000 already in use"**
→ Change PORT in `.env` to 5001, 5002, etc.

**"database.json not found"**
→ Normal! It will be created automatically

---

Good luck building! 🚀💚
