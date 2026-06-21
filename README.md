# SmartFlow — AI-Powered Productivity Platform

> A modern, SaaS-grade task management platform powered by a heuristic AI recommendation engine, dynamic analytics, and a sleek glassmorphic UI.

![SmartFlow Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 🤖 AI Recommendation Engine
- **Heuristic scoring algorithm** — Analyses task completion patterns to recommend the most relevant next-level challenges.
- **Progressive difficulty paths** — Advances from beginner → intermediate → advanced tasks automatically based on completion history.
- **7-category system** — Coding, Design, Study, Fitness, Business, Health, Other.
- **Anti-duplication** — Never recommends tasks already completed or in the active backlog.
- **Scoring factors**: Category preference (30pts), difficulty progression (25pts), completion history (10pts), productivity speed pattern (15pts), diversity (15pts), recent activity weight (15pts).

### 📊 Productivity Insights Dashboard
- **5 live performance metrics**: Productivity Score, Focus Score, Consistency Score, Learning Score, Weekly Growth Score.
- **All scores computed from real task data** — no fake values.
- **Activity Heatmap Grid** — GitHub-style completion heatmap for the past 16 weeks.
- **Dynamic text insights** — Auto-generated observations about productivity patterns, peak working hours, and weekly growth trends.
- **Re-score trigger button** — Instantly recalculate all metrics.

### 🎯 Smart Task Board
- **Full CRUD** — Create, Read, Update, and Delete tasks with live API sync.
- **Advanced filtering** — Filter by Status, Category, Priority, and Difficulty simultaneously.
- **Smart sorting** — Sort by Newest, Due Date, Priority, or Difficulty.
- **Real-time search** — Instant title filtering.
- **Priority & Difficulty badges** — Color-coded visual tags per task.
- **Due date support** — Calendar date picker with countdown display.
- **CSV & PDF export** — Download your full task report or print a productivity PDF.

### 🏆 Achievements System
Five unlockable badges tracking:
- Sprint Beginner, Streak Starter, Night Owl, Focus Wizard, Velocity Master.

### 🔐 Authentication & Security
- **JWT-based authentication** with 30-day token expiry.
- **Full OTP password recovery** flow — request, verify 6-digit code, reset.
- **Dev-mode OTP display** — OTP shown in UI for local development testing.
- **bcryptjs password hashing** with salt.
- **Protected API routes** via JWT middleware.

### ⚙️ Workspace Settings
Unified tabbed settings modal:
- **Profile tab** — Update name, email, profile image URL, and avatar gradient color theme.
- **Preferences tab** — Toggle dark/light theme, email notifications, default task sorting.
- **Security tab** — Change password with current password verification.
- **Danger Zone** — Permanently delete account with `DELETE` text confirmation guard.

### 🎨 UI/UX Design
- **Glassmorphism design system** using `backdrop-blur` and translucent panels.
- **Dark / Light mode** with system preference detection and persistence.
- **Framer Motion animations** — all modals, dropdowns, and panels are animated.
- **Custom animated toast notifications** with slide-in/out transitions.
- **Skeleton loading states** for task board on initial data fetch.
- **Onboarding tour** — 5-step interactive tutorial for new users.
- **Notification Center** — Slide-in panel with unread badge count, mark-all-read, and clear-all.

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+K` | Open Command Palette |
| `N` | Focus new task input |
| `/` | Focus task search |
| `T` | Toggle Dark/Light theme |
| `?` | Open keyboard shortcuts guide |
| `Esc` | Close all modals and panels |

### 🔍 Command Palette (`Ctrl+K`)
- Search all tasks by title.
- Toggle task completion from the palette.
- Create new tasks directly.
- Navigate to profile, password, settings, or logout.
- Toggle theme.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB (Mongoose) with in-memory MockDB fallback |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **Charts** | Chart.js (react-chartjs-2) — Doughnut & Bar charts |
| **Icons** | Lucide React |
| **Fonts** | Inter + Outfit (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 8+
- MongoDB (optional — use MockDB for development)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/AI-Project.git
cd AI-Project
```

**2. Install dependencies**
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

**3. Configure environment**

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartflow
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
USE_MOCK_DB=true
```

> Set `USE_MOCK_DB=true` to use the in-memory database (no MongoDB required).

**4. Run the application**

In separate terminals:

```bash
# Terminal 1 — Start backend
cd server && npm run dev

# Terminal 2 — Start frontend
cd client && npm run dev
```

**5. Open in browser**
```
http://localhost:5173
```

---

## 📁 Project Structure

```
AI-Project/
├── client/                    # React Frontend (Vite)
│   └── src/
│       ├── components/        # Reusable components
│       │   ├── CommandPalette.tsx
│       │   ├── CustomDropdown.tsx
│       │   ├── GlassCard.tsx
│       │   └── ThemeToggle.tsx
│       ├── pages/             # Page-level components
│       │   ├── DashboardPage.tsx  # Main application (2400+ lines)
│       │   ├── LandingPage.tsx
│       │   └── LoginPage.tsx
│       ├── utils/
│       │   └── api.ts         # Centralized API client
│       ├── App.tsx            # Root with routing and auth state
│       ├── index.css          # Global styles, theme utilities
│       └── main.tsx
│
└── server/                    # Express Backend (TypeScript)
    └── src/
        ├── config/            # DB connection
        ├── controllers/       # Route handlers
        │   ├── userController.ts
        │   ├── taskController.ts
        │   └── recommendationController.ts
        ├── middleware/        # Auth middleware
        ├── models/            # Mongoose models (User, Task)
        ├── routes/            # Express routers
        ├── services/
        │   └── recommendationService.ts  # AI Heuristic Engine
        ├── types/             # TypeScript interfaces
        └── utils/
            ├── mockDb.ts      # In-memory development database
            └── security.ts    # JWT secret management
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Register new user |
| `POST` | `/api/users/login` | Login and receive JWT |
| `POST` | `/api/users/forgot-password` | Request OTP |
| `POST` | `/api/users/verify-otp` | Verify OTP → receive reset token |
| `POST` | `/api/users/reset-password` | Reset password with token |

### User Profile *(Authenticated)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/users/profile` | Update name, email, avatar, password |
| `PUT` | `/api/users/settings` | Update theme, notifications, sorting |
| `DELETE` | `/api/users/profile` | Delete account and all tasks |

### Tasks *(Authenticated)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/:userId` | Get all tasks for user |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update task (title, status, priority, etc.) |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### AI Engine *(Authenticated)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recommendations/me` | Get AI task recommendations |
| `GET` | `/api/recommendations/me/insights` | Get productivity insight scores |

---

## 🧠 AI Recommendation Engine

The heuristic engine in `recommendationService.ts` uses a **weighted multi-factor scoring system**:

```
Task Score = 
  Category Preference Score    (0–30 pts)
+ Difficulty Progression Score (0–25 pts)
+ Completion History Score     (0–10 pts)
+ Speed Pattern Score          (0–15 pts)
+ Category Diversity Score     (0–15 pts)
+ Recent Activity Score        (0–15 pts)
```

**Total cap: 100 points.** Top 3 scoring tasks are recommended, excluding any already completed or active.

---

## 🔒 Security Notes

- Passwords are hashed with `bcryptjs` (10 salt rounds).
- JWT tokens expire in 30 days (session) or 15 minutes (password reset).
- `USE_MOCK_DB=false` disables development-mode OTP display in production.
- All mutation routes require a valid JWT via the `protect` middleware.

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ as a production-grade SaaS platform showcase.*
