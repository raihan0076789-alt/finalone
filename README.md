# 🏠 SmartArch — Full Stack AI-Powered Architecture Application

A complete house architecture design platform with AI chat, 3D visualization, multi-floor design, drag-and-drop rooms/doors/windows/staircases, export to CAD/OBJ/STL/GLTF, Google OAuth, email verification, support tickets, subscription plans (Razorpay), a dedicated client portal, architect marketplace, real-time presence, project sharing, ratings, and Ollama integration.

---

## 📁 Project Structure

```
smartarch
│
├── frontend
│   │
│   ├── css
│   │   ├── admin.css
│   │   ├── admin-restructured.css
│   │   ├── architect.css
│   │   ├── client-dashboard.css
│   │   ├── dashboard.css
│   │   ├── market-map.css
│   │   └── styles.css
│   │
│   ├── js
│   │   ├── admin.js
│   │   ├── admin-restructured.js
│   │   ├── api.js
│   │   ├── architect.js
│   │   ├── auth.js
│   │   ├── client-dashboard.js
│   │   ├── dashboard-charts.js
│   │   ├── dashboard-profile.js
│   │   ├── dashboard.js
│   │   ├── interior.js
│   │   ├── market-map.js
│   │   ├── presence.js
│   │   ├── reviews.js
│   │   ├── subscription.js
│   │   └── templates.js
│   │
│   ├── about.html
│   ├── admin-login.html
│   ├── admin.html
│   ├── architect.html
│   ├── client-about.html
│   ├── client-contact.html
│   ├── client-dashboard.html
│   ├── client-index.html
│   ├── client-privacy.html
│   ├── client-terms.html
│   ├── contact.html
│   ├── dashboard.html
│   ├── index.html
│   ├── privacy.html
│   ├── project-viewer.html
│   ├── reset-password.html
│   └── terms.html
│
├── backend-main
│   │
│   ├── config
│   │   └── db.js
│   │
│   ├── controllers
│   │   ├── adminController.js
│   │   ├── adminControllerExtended.js
│   │   ├── appRatingController.js
│   │   ├── architectController.js
│   │   ├── architectListingController.js
│   │   ├── architectRatingController.js
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── clientProjectController.js
│   │   ├── clientSupportController.js
│   │   ├── connectionController.js
│   │   ├── feedbackController.js
│   │   ├── modelController.js
│   │   ├── projectController.js
│   │   ├── projectShareController.js
│   │   ├── reviewController.js
│   │   ├── subscriptionController.js
│   │   └── ticketController.js
│   │
│   ├── middleware
│   │   ├── adminAuth.js
│   │   ├── auth.js
│   │   ├── planGuard.js
│   │   ├── uploadMiddleware.js
│   │   └── validation.js
│   │
│   ├── models
│   │   ├── AppRating.js
│   │   ├── ArchitectRating.js
│   │   ├── ClientProject.js
│   │   ├── ClientTicket.js
│   │   ├── Connection.js
│   │   ├── ModelVersion.js
│   │   ├── Project.js
│   │   ├── ProjectShare.js
│   │   ├── Review.js
│   │   ├── Subscription.js
│   │   ├── Ticket.js
│   │   └── User.js
│   │
│   ├── routes
│   │   ├── adminRoutes.js
│   │   ├── aiChatRoutes.js
│   │   ├── appRatingRoutes.js
│   │   ├── architectRoutes.js
│   │   ├── authRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── connectionRoutes.js
│   │   ├── modelRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── projectShareRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── ticketRoutes.js
│   │
│   ├── scripts
│   │   └── migrate-to-architect.js
│   │
│   ├── uploads
│   │   ├── chat/
│   │   └── client-projects/
│   │
│   ├── utils
│   │   ├── modelGenerator.js
│   │   ├── sendEmail.js
│   │   ├── verifyEmail.js
│   │   └── welcomeEmail.js
│   │
│   ├── package.json
│   └── server.js
│
├── backend-ai
│   │
│   ├── controllers
│   │   ├── architectureController.js
│   │   └── feedbackController.js
│   │
│   ├── middleware
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── requestLogger.js
│   │   └── validators.js
│   │
│   ├── routes
│   │   └── architectureRoutes.js
│   │
│   ├── services
│   │   ├── architectureService.js
│   │   └── exportService.js
│   │
│   ├── tests
│   │   └── api.test.js
│   │
│   ├── utils
│   │   ├── errors.js
│   │   └── logger.js
│   │
│   ├── .env.example
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── FRONTEND_README.md
│   ├── IMPROVEMENTS.md
│   ├── OLLAMA_SETUP.md
│   ├── package.json
│   ├── QUICKSTART.md
│   ├── README.md
│   └── server.js
│
├── package.json
└── README.md
```

---

## 🚀 Running the Project

### Prerequisites

1. **Node.js** v18+ — https://nodejs.org
2. **MongoDB** — https://www.mongodb.com/try/download/community
3. **Ollama** (for AI features) — https://ollama.ai
4. **Razorpay account** (optional, for subscription payments) — https://razorpay.com

---

### Step 1: Set up MongoDB

Make sure MongoDB is running:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

---

### Step 2: Set up Ollama (for AI Chat)

Install Ollama from https://ollama.ai, then pull the model:
```bash
ollama pull phi3:mini
```

Start Ollama server:
```bash
ollama serve
# Ollama runs on port 11434 by default
```

---

### Step 3: Install & Run Main Backend (Port 5000)

```bash
cd backend-main
npm install
npm start
# Or for development with auto-reload:
npm run dev
```

**Expected output:**
```
🏠 House Architect Backend running on port 5000
🌍 Environment: development
📡 API available at http://localhost:5000/api
💾 Database: mongodb://localhost:27017/house_architect
```

---

### Step 4: Install & Run AI Backend (Port 3001)

```bash
cd backend-ai
npm install
npm start
# Or:
npm run dev
```

**Expected output:**
```
AI Architect Backend Server running on port 3001
Health check available at http://localhost:3001/health
```

---

### Step 5: Open the Frontend

**Option A — Direct browser open:**
```bash
# Just open the file in your browser
open frontend/index.html         # macOS
start frontend/index.html        # Windows
xdg-open frontend/index.html     # Linux
```

**Option B — Serve with a local server (recommended for API calls):**
```bash
# Using Python
cd frontend
python3 -m http.server 3000
# Open http://localhost:3000

# Using Node.js http-server
npx http-server frontend -p 3000
# Open http://localhost:3000

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

**Client Portal:**
```bash
# Client landing page
open frontend/client-index.html
# Client dashboard
open frontend/client-dashboard.html
```

---

## 🎯 Features

### ✅ Authentication & User Management
- **Register / Login** — Email + password with JWT authentication
- **Google OAuth** — Sign in with Google (access-token flow)
- **Email Verification** — OTP-based email verification on signup
- **Forgot / Reset Password** — Token-based password reset via email
- **User Roles** — `architect` (formerly `user`), `client`, `admin`
- **Profile Management** — Update name, company, phone, avatar, preferences (theme, units, auto-save)
- **Architect Professional Profile** — Bio, location, specialization, years of experience, portfolio URLs (up to 10)
- **Account Suspension** — Admin can suspend/unsuspend users
- **Real-time Presence** — Heartbeat-based online/offline status (30 s ping, 60 s threshold)
- **Role Migration** — Legacy `user` role is backward-compatible; treated as `architect` transparently

### ✅ Subscription & Plan System (Razorpay)
- **Plans** — Free, Pro (₹499/mo), Enterprise (₹1,499/mo)
- **Razorpay Payment Integration** — Create order → verify signature → activate plan
- **Plan Guards** — Middleware enforces plan limits on API routes:
  - Free: 3 projects, 10 AI messages/month, no 3D export
  - Pro: 20 projects, 500 AI messages/month, OBJ/STL/GLTF export, multi-floor, 3D viz
  - Enterprise: unlimited projects and AI messages, all export formats including CAD
- **AI Message Quota** — Monthly counter with auto-reset; plan-gated via `aiMessageGuard`
- **Project Limit Guard** — Blocks project creation when plan quota is reached
- **Subscription UI** — Plan badges, upgrade modal, Razorpay popup in dashboard
- **Webhook Support** — Razorpay server-to-server webhook handler for plan lifecycle events

### ✅ Client Portal (New)
- **Dedicated Landing Page** (`client-index.html`) — "Find Your Perfect Architect" marketing page
- **Client Registration / Login** — Role-restricted to `client` only; architects directed to main portal
- **Client Dashboard** (`client-dashboard.html`) with sidebar navigation:
  - **Dashboard** — Overview stats and quick actions
  - **Find Architects** — Browse verified architects with filters
  - **My Architects** — Manage connection requests and active connections
  - **My Projects** — Client construction briefs (not architect design projects)
  - **Design Submissions** — View designs architects shared with the client
  - **Documents** — All downloaded design files
  - **Market Intelligence** — Global real estate market map
  - **Settings** — Account and preference management
  - **Support** — Dedicated client ticket system
- **Client Project Briefs** — Multi-step creation with file attachments (images, PDFs, DXF/DWG), budget range, land size, style, requirements (bedrooms, bathrooms, floors)

### ✅ Architect Marketplace & Connections
- **Architect Listing** — Clients browse verified architects filtered by specialization, experience, rating, and search term (paginated)
- **Architect Detail Page** — Full profile with portfolio, ratings, and project count
- **Connection Requests** — Client sends a connection request to an architect, optionally attaching a project brief and intro message
- **Request Management** — Architect accepts or rejects; client can cancel pending requests or remove rejected cards
- **In-App Chat** — Real-time text and image messaging between client and architect after connection is accepted (images: 8 MB max; jpg/png/webp/gif)
- **Project Brief Sharing** — Architect can view client's full project brief from the connection chat
- **Project Sharing** — Architect shares design projects with connected clients (connection mode or public token link); revoke anytime
- **Project Viewer** (`project-viewer.html`) — Read-only client view of shared architect projects with download options (JSON, SVG, PNG, OBJ)
- **Architect Rating** — Client rates architect (1–5 stars + review) after viewing a shared project; rating is aggregated on the architect profile
- **App Rating** — Users and guests can submit overall app ratings

### ✅ Design Canvas (architect.html)
- **Drag & Drop Rooms** — Click Room tool, click canvas to add rooms
- **Resize Rooms** — 8 handles on corners/edges (NW, N, NE, W, E, SW, S, SE)
- **Door Placement** — Press D, click near room wall to place door, drag to reposition
- **Window Placement** — Press W, click near room wall to place window, drag to reposition
- **Staircase Placement** — Press S, click canvas to place a staircase room
- **Undo / Redo** — Up to 60 undo steps (Ctrl+Z / Ctrl+Y)
- **Zoom** — Mouse wheel zoom on canvas
- **3D Model View** — Full 3D with proper floor stacking
- **Multi-Floor Support** — Floors stack with correct heights (Pro/Enterprise plan)
- **Interior View** — 3D furnished walkthrough
- **Style System** — Modern, Minimalist, Traditional, Luxury
- **Auto Layout** — Smart room arrangement
- **Templates** — Pre-built house layouts
- **Project Reviews Panel** — Collaborators and shared users can leave star ratings + comments per project

### ✅ AI Features
- **Ollama AI Chat** — Chat with AI about your design (right sidebar), plan-gated with monthly quota
- **AI Architecture Generator** — Generate layout ideas from text description
- **Floorplan Image Upload** — Upload a floorplan image and parse it with AI
- **AI Design Suggestions** — Proactive suggestions for interior, exterior, layout, and materials (plan-gated)
- **AI Design Feedback** — Get scored feedback on your project design (plan-gated)
- **AI Chat Proxy** — Main backend (`/api/ai/*`) proxies to AI backend with plan enforcement; supports Node 18 native fetch with http.request fallback
- **Rate Limiting** — 100 requests per 15 minutes per IP (AI backend level)

### ✅ Export
- **JSON** — Export project data as JSON
- **SVG** — Export floor plan as SVG
- **PNG** — Export floor plan as PNG image
- **DXF (CAD)** — Export 2D floor plan for AutoCAD — Enterprise plan only
- **OBJ** — Export 3D model as OBJ + MTL files — Pro/Enterprise
- **STL** — Export 3D model for 3D printing — Pro/Enterprise
- **GLB (GLTF)** — Export 3D model as binary glTF 2.0 — Pro/Enterprise
- **Export Engine v3** — Full geometry rewrite: foundation slab, outer walls, ceiling/floor slabs, interior partitions, door frames + panels, window frames + glass panes, staircase steps, flat/hip/gable roofs; PBR materials throughout

### ✅ Market Intelligence Map (New)
- **Global Real Estate Market Map** — Interactive Leaflet map with 90+ cities worldwide
- **Data per City** — Price per m² (USD), YoY growth %, rental yield %, proximity, electricity, transport, schools, property type
- **Construction Cost Calculator** — Estimate build cost based on area and city
- **Architecture Market Suitability Score** — Scoring for market opportunities
- **Climate Risk Layer** — Overlay climate/risk indicators
- **Tier Filtering** — Filter cities by affordability tier (A–D)

### ✅ Project Management
- **Save / Load Projects** — Full project persistence in MongoDB
- **Version History** — View and restore previous project versions
- **Collaborators** — Add collaborators with `viewer`, `editor`, or `admin` roles
- **Project Status** — `draft`, `in_progress`, `review`, `approved`, `archived`
- **Project Types** — `residential`, `commercial`, `industrial`, `mixed`
- **AI Feedback Storage** — Save and retrieve AI feedback per project
- **Project Sharing** — Share via connected client or public link; revoke anytime

### ✅ Admin Panel (admin.html)
- **Dashboard Stats** — Users, projects, AI score analytics, app rating stats
- **User Management** — Architects and Clients tabs; list, view, suspend/unsuspend, delete, verify users; filter by plan, verification, and role
- **Project Management** — Architect projects and client project briefs; analytics
- **Support Tickets** — Architect tickets and Client tickets (separate tabs); reply, update status, unread badges
- **Connection Requests** — View all client ↔ architect connection requests with status
- **Review Management** — View and delete project reviews; review stats

### ✅ Support Ticket System
- **Separate Systems** — Architects use `/api/tickets`; Clients use `/api/client/support`
- **Threaded Replies** — Admin and user can exchange messages per ticket
- **Status Tracking** — `new`, `seen`, `replied`, `closed`
- **Unread Badges** — Separate unread counts for users and admins

### 🔑 Keyboard Shortcuts
| Key | Action |
|-----|--------|
| V | Select tool |
| R | Add room tool |
| D | Door tool |
| W | Window tool |
| S | Staircase tool |
| M | Measure tool |
| Ctrl+S | Save project |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Del / Backspace | Delete selected room |
| Esc | Cancel current tool |

### 🛠️ Tools
- **Select** — Click to select, drag to move, 8-handle resize
- **Room** — Click on canvas to add room at that position
- **Door** — Click near a room wall edge to place door; drag placed door to move it
- **Window** — Click near a room wall edge to place window; drag placed window to move it
- **Staircase** — Click on canvas to place a staircase
- **Measure** — Measurement tool

---

## 🌐 API Endpoints

### Main Backend (Port 5000)

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new architect user |
| POST | /api/auth/login | Login |
| POST | /api/auth/google | Google OAuth (ID token) |
| POST | /api/auth/google-profile | Google OAuth (access token) |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/password | Update password |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/verify-otp | Verify email OTP |
| POST | /api/auth/resend-verification | Resend verification OTP |
| POST | /api/auth/forgot-password | Request password reset email |
| PUT | /api/auth/reset-password/:token | Reset password |
| POST | /api/auth/heartbeat | Update lastSeen for presence |

#### Architect Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/architect/profile | Get architect professional profile |
| PUT | /api/architect/profile | Update profile (bio, location, specialization, experience, portfolio) |
| GET | /api/architect/me | Alias for /api/architect/profile |

#### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create project (plan limit enforced) |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/collaborators | Add collaborator |
| GET | /api/projects/:id/versions | Get version history |
| POST | /api/projects/:id/versions/:versionId/restore | Restore version |
| GET | /api/projects/:id/ai-feedback | Get AI feedback |
| PUT | /api/projects/:id/ai-feedback | Save AI feedback |

#### Project Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/share | Share project with client (connection or link mode) |
| GET | /api/projects/:id/shares | List all shares for a project |
| DELETE | /api/projects/:id/shares/:shareId | Revoke a share |
| GET | /api/shares/connected-clients | Get connected clients list (for share modal) |
| GET | /api/shares/my | Get all projects shared with the logged-in client |
| GET | /api/shares/token/:token | Public: access a shared project by token |
| POST | /api/shares/:shareId/rate | Client: submit/update architect rating |
| GET | /api/shares/:shareId/rating | Client: get own rating for a share |

#### Models & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/models/:projectId/floorplan | Generate floor plan model |
| POST | /api/models/:projectId/3d | Generate 3D model |
| GET | /api/models/:projectId/stats | Get model stats |
| GET | /api/models/:projectId/export/:format | Export model |

#### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reviews/:projectId | Get all reviews for a project |
| POST | /api/reviews/:projectId | Create or update own review |
| DELETE | /api/reviews/:projectId | Delete own review |
| GET | /api/reviews/admin/stats | Admin: review stats |
| DELETE | /api/reviews/admin/:reviewId | Admin: delete any review |

#### Subscriptions (Razorpay)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/subscriptions/subscribe | Create Razorpay order for plan upgrade |
| POST | /api/subscriptions/verify | Verify payment signature and activate plan |
| POST | /api/subscriptions/webhook | Razorpay server-to-server webhook |
| GET | /api/subscriptions/status | Get current plan info |

#### AI Chat Proxy (plan-gated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/chat | AI chat (proxied to AI backend, counts monthly quota) |
| POST | /api/ai/suggest | AI design suggestions (quota-gated) |
| POST | /api/ai/feedback | AI design feedback (quota-gated) |
| POST | /api/ai/floorplan/generate | AI floorplan generation |

#### Client Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/client/register | Register new client |
| POST | /api/client/login | Client login |
| GET | /api/client/me | Get client profile |
| PUT | /api/client/profile | Update client profile |
| GET | /api/client/dashboard | Client dashboard stats |
| DELETE | /api/client/account | Delete client account |
| POST | /api/client/projects | Create client project brief (multipart, up to 10 attachments) |
| GET | /api/client/projects | Get own project briefs |
| GET | /api/client/projects/:id | Get project brief |
| PUT | /api/client/projects/:id | Update project brief |
| DELETE | /api/client/projects/:id | Delete project brief |
| DELETE | /api/client/projects/:id/attachments/:filename | Delete a project attachment |
| GET | /api/client/architects | Browse verified architects (filterable) |
| GET | /api/client/architects/:id | View architect profile detail |
| POST | /api/client/support | Submit client support ticket |
| GET | /api/client/support | Get own tickets |
| GET | /api/client/support/unread | Get unread ticket count |
| GET | /api/client/support/:id | Get ticket detail |
| POST | /api/client/support/:id/reply | Reply to a ticket |
| GET | /api/client/support/admin/all | Admin: all client tickets |
| GET | /api/client/support/admin/unread-count | Admin: unread client ticket count |
| GET | /api/client/support/admin/:id | Admin: get client ticket |
| POST | /api/client/support/admin/:id/reply | Admin: reply to client ticket |
| PATCH | /api/client/support/admin/:id/status | Admin: update client ticket status |

#### Connections (Client ↔ Architect)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/connections/request | Client: send connection request to architect |
| GET | /api/connections/status/:architectId | Client: check connection status with architect |
| DELETE | /api/connections/:id | Client: cancel pending request |
| DELETE | /api/connections/:id/rejected | Client: remove a rejected connection card |
| GET | /api/connections/my | Get all connections (client + architect) |
| PUT | /api/connections/:id/respond | Architect: accept or reject request |
| GET | /api/connections/:id/project-brief | Architect: view client's project brief |
| GET | /api/connections/:id/messages | Get chat messages |
| POST | /api/connections/:id/messages | Send text message |
| POST | /api/connections/:id/messages/image | Send image message (multipart) |

#### App Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/app-ratings | Submit app rating (guest or authenticated) |
| GET | /api/app-ratings/admin/stats | Admin: app rating analytics |
| DELETE | /api/app-ratings/admin/:id | Admin: delete an app rating |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login |
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/users | List all users (architects) |
| GET | /api/admin/users/:id | Get user by ID |
| PATCH | /api/admin/users/:id/status | Suspend / unsuspend user |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/projects | List all architect projects |
| GET | /api/admin/projects/:id | Get project by ID |
| PATCH | /api/admin/projects/:id/visibility | Toggle project visibility |
| DELETE | /api/admin/projects/:id | Delete project |
| GET | /api/admin/ai-scores | AI score analytics |
| GET | /api/admin/client-projects | List all client project briefs |
| GET | /api/admin/client-projects/:id | Get client project brief |
| GET | /api/admin/client-projects/analytics | Client project analytics |

#### Architect Support Tickets (original system)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tickets | Submit support ticket (guest or user) |
| GET | /api/tickets/my | Get own tickets |
| GET | /api/tickets/my/unread | Get own unread count |
| GET | /api/tickets/admin/all | Admin: list all architect tickets |
| GET | /api/tickets/admin/unread-count | Admin: unread count |
| GET | /api/tickets/admin/:id | Admin: get ticket |
| POST | /api/tickets/admin/:id/reply | Admin: reply to ticket |
| PATCH | /api/tickets/admin/:id/status | Admin: update ticket status |

#### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |

---

### AI Backend (Port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/architecture/floorplan/generate | Generate floor plan from requirements |
| POST | /api/architecture/floorplan/upload-image | Parse uploaded floorplan image |
| POST | /api/architecture/chat | Chat with AI about your design |
| POST | /api/architecture/feedback | Get AI design feedback & score |
| POST | /api/architecture/suggest | Get proactive AI design suggestions |
| POST | /api/architecture/export/cad | Export as DXF (AutoCAD) |
| POST | /api/architecture/export/obj | Export as OBJ + MTL |
| POST | /api/architecture/export/stl | Export as STL (3D printing) |
| POST | /api/architecture/export/gltf | Export as GLB (glTF 2.0) |
| GET | /health | Health check |
| GET | /api/status | Status check |

---

## 🔧 Configuration

### backend-main/.env
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/house_architect
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# Email (Nodemailer SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM_NAME=SmartArch
ADMIN_EMAIL=admin@example.com

# AI Backend URL (proxy target)
AI_BACKEND_URL=http://localhost:3001

# Razorpay (for subscription payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### backend-ai/.env
```env
PORT=3001
NODE_ENV=development
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:mini
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_REQUEST_SIZE=10mb
```

### frontend/index.html (Google OAuth)
To enable Google Sign-In, set the `GOOGLE_CLIENT_ID` meta tag in `index.html`:
```html
<meta name="google-client-id" content="YOUR_GOOGLE_CLIENT_ID_HERE">
```

---

## 📦 Subscription Plans

| Feature | Free | Pro (₹499/mo) | Enterprise (₹1,499/mo) |
|---------|------|---------------|------------------------|
| Saved projects | 3 | 20 | Unlimited |
| AI messages / month | 10 | 500 | Unlimited |
| 2D floor plan editor | ✅ | ✅ | ✅ |
| Basic room templates | ✅ | ✅ | ✅ |
| Multi-floor design | ❌ | ✅ | ✅ |
| 3D visualization | ❌ | ✅ | ✅ |
| Export OBJ / STL / GLTF | ❌ | ✅ | ✅ |
| Export CAD (DXF) | ❌ | ❌ | ✅ |
| Priority support | ❌ | ✅ | ✅ |

---

## 🗃️ Database Migration

If you have existing users with the legacy `user` role, run the migration script once to promote them to `architect` and backfill new professional fields:

```bash
cd backend-main
node scripts/migrate-to-architect.js
```

This is safe to re-run — it preserves existing field values and only sets defaults where fields are missing.

---

## 🐛 Troubleshooting

### AI Chat not working?
1. Make sure Ollama is running: `ollama serve`
2. Check model is pulled: `ollama list`
3. Make sure AI backend is on port 3001: `curl http://localhost:3001/health`
4. Check your plan's monthly AI message limit — upgrade if exhausted

### Cannot save project?
1. Make sure main backend is on port 5000: `curl http://localhost:5000/api/health`
2. Make sure MongoDB is running
3. Check if the project limit for your plan is reached (Free: 3 projects)

### 3D not rendering?
- CDN connection required for Three.js
- Check browser console for errors
- Try refreshing after the page fully loads

### Floors not aligned?
- Each floor uses its own height value
- Update floor height in Project Settings and refresh 3D

### Email not sending?
- Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` in `backend-main/.env`
- For Gmail, use an App Password (not your account password)

### Google Sign-In not showing?
- Set `GOOGLE_CLIENT_ID` in the `<meta>` tag in `frontend/index.html`
- Make sure the origin is whitelisted in your Google Cloud Console OAuth credentials

### Export (DXF/OBJ/STL/GLB) not working?
- These exports require the AI backend to be running on port 3001
- Check: `curl http://localhost:3001/health`
- DXF export requires Enterprise plan; OBJ/STL/GLB require Pro or Enterprise plan

### Razorpay payment not completing?
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend-main/.env`
- Use test keys (`rzp_test_*`) in development mode
- Ensure webhook secret matches your Razorpay dashboard configuration

### Client portal login rejected?
- Client login (`/api/client/login`) only accepts accounts with `role: client`
- Architects must use the main login (`/api/auth/login`) on `index.html`

### Connection chat images not uploading?
- Max image size is 8 MB (jpg, png, webp, gif only)
- Ensure the `uploads/chat/` directory exists and is writable

---

## 📋 Quick Start (All at Once)

Open 4 terminal windows:

**Terminal 1 — MongoDB:**
```bash
mongod
```

**Terminal 2 — Main Backend:**
```bash
cd backend-main && npm install && npm start
```

**Terminal 3 — AI Backend:**
```bash
cd backend-ai && npm install && npm start
```

**Terminal 4 — Frontend:**
```bash
cd frontend && python3 -m http.server 3000
```

Then open:
- **Architect portal:** http://localhost:3000 (`index.html`)
- **Client portal:** http://localhost:3000/client-index.html
- **Admin panel:** http://localhost:3000/admin-login.html