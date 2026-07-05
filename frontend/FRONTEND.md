# Frontend Documentation

**React 18 + Vite + TypeScript SPA for Umoja Skills**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State Management | Zustand |
| Data Fetching | Axios + TanStack Query (React Query) |
| Forms | React Hook Form + Zod validation |
| Routing | React Router DOM v6 |
| Icons | Lucide React |
| Supabase | `@supabase/supabase-js` (publishable key only) |
| Deploy | Vercel |

---

## Project Structure

```
frontend/src/
├── api/                  # Axios API call modules
│   ├── axios.ts          # Configured Axios instance (JWT interceptor)
│   ├── auth.ts           # register, login, getMe, updateProfile
│   ├── services.ts       # getCategories, getListings, getProviderProfile
│   ├── bookings.ts       # getBookings, createBooking, updateBooking
│   ├── reviews.ts        # getReviews, createReview
│   ├── messaging.ts      # getConversations, getMessages, sendMessage
│   └── dashboard.ts      # getClientDashboard, getProviderDashboard
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── client/
│   │   ├── ClientDashboardPage.tsx
│   │   ├── SearchPage.tsx              # Browse/search service listings
│   │   ├── ProviderProfilePage.tsx     # View provider + book service
│   │   ├── BookingsPage.tsx            # Client's booking history
│   │   └── SavedProvidersPage.tsx      # Bookmarked services
│   ├── provider/
│   │   ├── ProviderDashboardPage.tsx
│   │   ├── MyServicesPage.tsx          # List provider's services
│   │   ├── AddServicePage.tsx          # Create / edit a service listing
│   │   ├── ProviderBookingsPage.tsx    # Incoming bookings
│   │   └── EarningsPage.tsx           # Revenue breakdown + chart
│   └── shared/
│       ├── MessagesPage.tsx            # Unified messaging
│       ├── ProfilePage.tsx             # Edit own profile + KYC upload
│       └── SettingsPage.tsx
│
├── components/           # Reusable UI components
│   └── layout/
│       └── AppLayout.tsx # Sidebar + header shell
│
├── router/
│   ├── index.tsx         # Route definitions
│   └── ProtectedRoute.tsx # Auth guard + role guard
│
├── store/                # Zustand stores
├── types/                # Shared TypeScript types (index.ts)
├── utils/                # Helper functions
├── data/                 # Static/seed data
└── main.tsx              # App entry point
```

---

## Routing

All authenticated routes are wrapped in `<ProtectedRoute>` which checks for a valid JWT in Zustand store. Role-restricted routes additionally check `user.role`.

| Path | Component | Auth | Role |
|---|---|---|---|
| `/login` | LoginPage | — | — |
| `/register` | RegisterPage | — | — |
| `/forgot-password` | ForgotPasswordPage | — | — |
| `/reset-password` | ResetPasswordPage | — | — |
| `/dashboard` | DashboardRouter (role-aware) | ✅ | any |
| `/search` | SearchPage | ✅ | any |
| `/providers/:id` | ProviderProfilePage | ✅ | any |
| `/bookings` | BookingsPage / ProviderBookingsPage | ✅ | any |
| `/messages` | MessagesPage | ✅ | any |
| `/messages/:conversationId` | MessagesPage | ✅ | any |
| `/profile` | ProfilePage | ✅ | any |
| `/settings` | SettingsPage | ✅ | any |
| `/saved` | SavedProvidersPage | ✅ | CLIENT |
| `/my-services` | MyServicesPage | ✅ | PROVIDER |
| `/my-services/add` | AddServicePage | ✅ | PROVIDER |
| `/my-services/:id/edit` | AddServicePage | ✅ | PROVIDER |
| `/earnings` | EarningsPage | ✅ | PROVIDER |

The `DashboardRouter` component inspects the user's role and renders either `ClientDashboardPage` or `ProviderDashboardPage` automatically.

---

## API Layer (`src/api/`)

### Axios Instance (`axios.ts`)
- Attaches `Authorization: Bearer <token>` on every request from Zustand store
- Base URL: `VITE_API_URL` env var
- Handles 401 responses (token expiry flow)

### Key API functions

```typescript
// Auth
register(data)           → { user, access, refresh }
login(email, password)   → { user, access, refresh }
getMe()                  → User
updateProfile(data)      → User

// Services
getCategories()          → Category[]
getListings(params)      → PaginatedResponse<ServiceListing>
getProviderProfile(uuid) → ProviderProfile

// Bookings
getBookings()            → Booking[]
createBooking(data)      → Booking
updateBooking(id, data)  → Booking

// Reviews
getReviews(params)       → Review[]
createReview(data)       → Review

// Messaging
getConversations()       → Conversation[]
getMessages(convId)      → Message[]
sendMessage(convId, body)→ Message

// Dashboard
getClientDashboard()     → ClientDashboardData
getProviderDashboard()   → ProviderDashboardData
```

---

## State Management (Zustand)

Zustand stores are in `src/store/`. The primary store holds:

```typescript
{
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setUser(user, access, refresh): void
  clearAuth(): void
}
```

Auth state is persisted to `localStorage` so users stay logged in across page refreshes.

---

## Forms & Validation

Forms use **React Hook Form** with **Zod** schemas for client-side validation.

### Register form validation
- Email: valid format required
- Password: min 8 chars, uppercase + number (mirrors backend rules)
- First/last name: letters, hyphens, apostrophes only
- Phone: Kenyan format (`+2547XXXXXXXX` / `07XXXXXXXX`)
- Role: CLIENT or PROVIDER (radio selection with description)

---

## Key Pages

### SearchPage (`/search`)
- Search box + category filter chips
- Results grid of `ServiceListing` cards
- Each card links to `/providers/:id`

### ProviderProfilePage (`/providers/:id`)
- Provider info (name, rating, location, bio, years experience)
- Service listing details and price
- "Book Now" button → opens booking modal with date/time picker and notes
- Reviews section
- "Message Provider" → creates/opens conversation
- Save/unsave to favourites

### ClientDashboardPage (`/dashboard` — CLIENT)
- Stats: total bookings, completed this month, reviews given, provider count
- Recent bookings activity feed
- Recommended services carousel

### ProviderDashboardPage (`/dashboard` — PROVIDER)
- Stats: total bookings, completed jobs, total earnings (KES), avg rating
- Upcoming bookings list
- Recent reviews received

### EarningsPage (`/earnings` — PROVIDER)
- Lifetime earnings total
- Per-booking breakdown table (client, service, amount, date)
- Monthly earnings summary

### ProfilePage (`/profile`)
- Edit name, phone, location, avatar
- KYC section: upload National ID / Passport / Business Permit
  - Status badge: PENDING / APPROVED / REJECTED
  - Form submits to `/api/auth/verify-profile/`

### MessagesPage (`/messages`)
- Conversation list sidebar
- Chat thread with message bubbles
- Real-time typing indicator

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:8000/api` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | `sb_publishable_...` |

> The frontend only uses the **publishable** (anon) Supabase key — never the service role key. Since all tables have RLS with no permissive policies, the publishable key has no access to any data directly.

---

## Development

```bash
cd frontend
npm install
cp .env.example .env      # fill in VITE_API_URL etc.
npm run dev               # starts on http://localhost:5173
```

### Other scripts
```bash
npm run build    # production bundle (dist/)
npm run preview  # preview the production build
npm run lint     # ESLint check
```

---

## Deployment (Vercel)

1. Connect the `frontend/` directory to a Vercel project
2. Set these environment variables in Vercel dashboard:
   - `VITE_API_URL=https://umoja-skills.onrender.com/api`
   - `VITE_SUPABASE_URL=https://smfurojgloigggjykmql.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>`
3. Vercel auto-deploys on every push to `master`

The `vercel.json` configures SPA fallback routing so deep links work correctly:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## TypeScript Types (`src/types/index.ts`)

Key shared interfaces:
```typescript
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: 'CLIENT' | 'PROVIDER'
  avatar: string | null
  location: string
  is_verified: boolean
}

interface ServiceListing {
  id: string
  provider: User
  category: ServiceCategory
  title: string
  description: string
  price_kes: number | null
  service_area: string
  photos: string[]
  is_active: boolean
}

interface Booking {
  id: string
  client: User
  service: ServiceListing
  scheduled_at: string
  notes: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  created_at: string
}
```
