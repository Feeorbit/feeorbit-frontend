# FeeOrbit OS — Frontend ⚡

Modern, cybernetic Next.js client for **FeeOrbit** — the Intelligent Multi-Tenant Operating System for Gyms & Fitness Centers in India.

---

## 🚀 Key Features

- **Cybernetic Command Deck**: Ultra-modern, responsive management dashboard for gym owners, branch managers, and members.
- **AI Fitness Coach Wizard**: Interactive step-by-step fitness & nutrition assessment with dynamic target calorie/protein balancing and Indian staple diet calculations.
- **Zero-Hardware Kiosk Check-In**: Turn low-cost tablet/phone screens into 0.3-second QR scanner terminals with sound effects and instant member check-ins.
- **Real-Time Gym Chat**: WebSocket-powered chat channels, community groups, direct messaging, message reactions, and media sharing.
- **Dynamic Multi-Theming Engine**: 12 custom cybernetic & light/dark themes (Obsidian, Pearl, Arctic, Champagne, Mint, Midnight, Emerald, Titanium, and more).
- **Automated Billing & Dues Tracker**: 1-click WhatsApp payment reminders with dynamic UPI deep links and automated invoice generation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Library**: React 18
- **Icons**: Lucide React
- **Real-Time Communication**: Socket.io Client
- **QR Engine**: html5-qrcode, qrcode
- **Visuals**: Canvas Confetti, Custom Glassmorphic CSS Engine

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Feeorbit/feeorbit-frontend.git

# Navigate to client directory
cd feeorbit-frontend

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your backend API URL:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security
- All sensitive environment credentials are kept strictly out of git version control via `.gitignore`.
- Only public URLs are exposed via Next.js client-side bundles.

---

## 👤 Author
- **Rahul Singh** ([@rahulyo954030](https://github.com/rahulyo954030))
- Organization: [FeeOrbit](https://github.com/Feeorbit)

