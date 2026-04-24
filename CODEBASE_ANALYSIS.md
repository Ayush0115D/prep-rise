# Prep-Rise Codebase Analysis

## 📌 Project Overview

**Prep-Rise** (also known as **Prepwise**) is an **AI-powered job interview preparation platform** that uses conversational AI voice agents to conduct mock interviews and provide instant feedback to job candidates.

**Core Value Proposition:**
- Conduct realistic mock interviews powered by **Vapi AI voice agents**
- Get instant, detailed AI-generated feedback based on your performance
- Practice role-specific interview questions in a user-friendly interface
- Track interview history and progress with a personalized dashboard

---

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **Next.js 15.3.0** with TypeScript (App Router)
- **React 19.0.0**
- **Tailwind CSS 4** with PostCSS for styling
- **Turbopack** for fast local development (`npm run dev --turbopack`)

### UI Components & Libraries
- **shadcn/ui** - Headless component library
- **Radix UI** - Primitives (label, slot)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **React Hook Form** - Form state management with Zod validation
- **Next Themes** - Dark mode support

### Backend & APIs
- **Firebase** (client + admin)
  - Authentication (email/password via Firebase Auth)
  - Firestore database
  - Session management with cookies
- **Vapi AI Web SDK** (`@vapi-ai/web`) - Voice agent integration
- **Google Generative AI** (`@ai-sdk/google`, Gemini 2.0 Flash) - Question generation & feedback analysis
- **Vercel AI SDK** (`ai` package) - LLM integration wrapper

### Build Tools & Configuration
- **TypeScript 5** - Strict mode enabled
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing
- **Path alias** - `@/*` resolves to root

---

## 📁 Project Structure & Key Directories

```
prep-rise/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with Sonner Toaster & LogoutButton
│   ├── globals.css               # Global styles
│   ├── (auth)/                   # Auth segment
│   │   ├── layout.tsx
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (root)/                   # Main app segment
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard/home page
│   │   └── interview/
│   │       ├── page.tsx          # Interview selection/creation
│   │       └── [id]/
│   │           ├── page.tsx      # Interview conductor
│   │           └── feedback/
│   │               └── page.tsx  # Feedback/results page
│   ├── api/                      # Backend API routes
│   │   ├── logout/route.ts
│   │   └── vapi/generate/route.ts
│
├── components/                   # React components
│   ├── Agent.tsx                 # Vapi AI voice agent controller
│   ├── AuthForm.tsx              # Sign-in/sign-up form
│   ├── DisplayTechIcons.tsx      # Tech stack visualization
│   ├── FormField.tsx             # Reusable form field wrapper
│   ├── InterviewCard.tsx         # Interview card UI
│   ├── LogoutButton.tsx          # Logout button (conditionally rendered)
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── sonner.tsx
│
├── lib/                          # Utilities & server actions
│   ├── utils.ts                  # Misc utilities (class merging, cover images)
│   ├── vapi.sdk.ts               # Vapi SDK initialization
│   └── actions/
│       ├── auth.action.ts        # Auth server actions (signUp, setSessionCookie)
│       └── general.action.ts     # Data operations (createFeedback, interviews)
│
├── firebase/
│   ├── client.ts                 # Client-side Firebase setup (Auth, Firestore)
│   └── admin.ts                  # Admin SDK setup (server-side operations)
│
├── constants/                    # App constants
│   └── index.ts                  # Tech mappings, interviewer config, feedback schema
│
├── types/
│   ├── index.d.ts                # TypeScript interfaces (User, Interview, Feedback, etc.)
│   └── vapi.d.ts                 # Vapi-specific types
│
├── public/covers/                # Interview cover images
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
└── package.json
```

---

## 🔐 Core Features & Data Flow

### 1. **Authentication System** (`(auth)/`)
**Flow:**
```
Sign-Up/Sign-In Page → Firebase Auth (email/password) → Session Cookie → Redirect to Dashboard
```

**Key Files:**
- [AuthForm.tsx](components/AuthForm.tsx) - Form UI (client component)
- [auth.action.ts](lib/actions/auth.action.ts) - Server actions for auth
- [client.ts](firebase/client.ts) - Firebase client init

**Process:**
- User signs up/in with email & password via Firebase Auth
- Firebase returns `idToken` after authentication
- Server creates session cookie (1 week expiry, httpOnly, secure)
- Cookie stored via `setSessionCookie()` action
- User redirected to home dashboard

**Key Details:**
- Session duration: 7 days (604800 seconds)
- Cookies are httpOnly and secure in production

---

### 2. **Interview Creation** (`(root)/interview/`)
**Flow:**
```
User fills form (role, level, techstack, type) → POST /api/vapi/generate → Gemini generates questions → Store in Firestore → Redirect to interview
```

**Key Files:**
- [interview/page.tsx](app/(root)/interview/page.tsx) - Interview creation form
- [generate/route.ts](app/api/vapi/generate/route.ts) - API endpoint for question generation

**Process:**
1. User provides:
   - **Job role** (e.g., "Frontend Developer")
   - **Experience level** (Junior, Mid, Senior)
   - **Tech stack** (comma-separated: React, Node.js, etc.)
   - **Question type** (behavioral vs technical focus)
   - **Number of questions** (e.g., 3-5)

2. Gemini 2.0 Flash generates questions via `/api/vapi/generate`
   - Prompt specifies formatting for voice assistant (no `/`, `*`, special chars)
   - Returns questions as JSON array

3. Interview document stored in Firestore with:
   - `role`, `level`, `techstack`, `type`, `questions[]`
   - `userId`, `coverImage`, `createdAt`
   - `finalized: true`

4. User redirected to interview conductor page

**Tech Stack Mapping:**
- [constants/index.ts](constants/index.ts) maps user input (e.g., "next.js") to standardized names (e.g., "nextjs")
- 100+ tech mappings included

---

### 3. **Interview Conductor** (`(root)/interview/[id]/`)
**Flow:**
```
Load interview → Initialize Vapi SDK → Stream audio/transcript → Collect user responses → End call → Store transcript
```

**Key Files:**
- [[id]/page.tsx](app/(root)/interview/[id]/page.tsx) - Interview conductor UI
- [Agent.tsx](components/Agent.tsx) - Vapi SDK controller & call management

**Process:**

**Agent Component State:**
- `callStatus`: `INACTIVE → CONNECTING → ACTIVE → FINISHED`
- `messages[]`: Array of `{ role: "user" | "assistant", content: string }`
- `isSpeaking`: Boolean for speaker visualization
- `transcript`: Real-time transcript from Vapi

**Vapi Integration:**
```typescript
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

// Workflows:
1. onCallStart() → Set status to ACTIVE
2. onMessage(message) → Capture final transcripts
3. onSpeechStart/End() → Track speaker state
4. onCallEnd() → Set status to FINISHED, trigger feedback generation
```

**Interview Flow:**
1. Agent initializes Vapi call with:
   - Interview questions from Firestore
   - Assistant configuration (role, system prompt)
   - Custom voice settings

2. Vapi conducts interview:
   - Asks questions sequentially
   - Captures user audio + transcription
   - Real-time transcript streamed to UI

3. User responds (voice or text)
   - Final transcripts saved to `messages[]`
   - Displayed in chat-like UI

4. Interview ends:
   - `onCallEnd()` triggered
   - Transcript sent to feedback generation

---

### 4. **Feedback Generation & Analysis**
**Flow:**
```
Interview ends → Format transcript → Send to Gemini → Structured feedback → Store in Firestore → Display to user
```

**Key Files:**
- [general.action.ts](lib/actions/general.action.ts) - `createFeedback()` server action
- [feedback/page.tsx](app/(root)/interview/[id]/feedback/page.tsx) - Feedback display

**Feedback Structure:**
```typescript
interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;           // 0-100
  categoryScores: [
    { name: string; score: number; comment: string },
    // Categories:
    // - Communication Skills
    // - Technical Knowledge
    // - Problem-Solving
    // - Cultural & Role Fit
    // - Confidence & Clarity
  ];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}
```

**Generation Process:**
1. Interview transcript formatted as: `- role: content\n`
2. Sent to Gemini 2.0 Flash with:
   - **Prompt**: Evaluate candidate against 5 categories (no other categories allowed)
   - **System prompt**: "You are a professional interviewer analyzing a mock interview"
   - **Structured output**: Zod schema for consistent JSON response

3. Feedback stored in Firestore at `feedback/{feedbackId}`

**Grading Criteria:**
- Communication Skills: Clarity, articulation, structured responses
- Technical Knowledge: Understanding of key concepts
- Problem-Solving: Analysis & solution proposal
- Cultural & Role Fit: Company values & role alignment
- Confidence & Clarity: Engagement & response quality

---

### 5. **Dashboard & Interview History** (`(root)/`)
**Flow:**
```
Load user → Fetch user's interviews → Display in cards → Link to interview details
```

**Key Files:**
- [page.tsx](app/(root)/page.tsx) - Dashboard home
- [InterviewCard.tsx](components/InterviewCard.tsx) - Card component

**Data Queries:**
- `getInterviewsByUserId()` - User's created interviews
- `getLatestInterviews()` - Recent interviews (for exploring)

**Displayed Data:**
- Interview role, level, techstack, creation date
- Link to interview conductor or feedback page

---

## 🔄 Data Models & Firestore Collections

### Collections:

#### `users/`
```typescript
{
  id: string (uid)
  name: string
  email: string
  profileURL?: string  // TODO: not implemented
  resumeURL?: string   // TODO: not implemented
}
```

#### `interviews/`
```typescript
{
  id: string (auto-generated)
  role: string              // e.g., "Frontend Developer"
  level: string             // e.g., "Senior"
  questions: string[]       // e.g., ["What is React?", "..."]
  techstack: string[]       // e.g., ["React", "Node.js"]
  type: string              // e.g., "technical" or "behavioral"
  userId: string
  finalized: boolean        // true when questions generated
  coverImage: string        // Random cover image URL
  createdAt: ISO timestamp
}
```

#### `feedback/`
```typescript
{
  id: string (auto-generated or provided)
  interviewId: string
  userId: string
  totalScore: number        // 0-100
  categoryScores: [
    { name, score, comment },
    ...
  ]
  strengths: string[]
  areasForImprovement: string[]
  finalAssessment: string
  createdAt: ISO timestamp
}
```

---

## 🛠️ Key Dependencies & Their Roles

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.3.0 | React framework + server components |
| `@vapi-ai/web` | 2.2.5 | Voice agent SDK (core interview logic) |
| `@ai-sdk/google` | 1.2.3 | Gemini LLM integration |
| `ai` | 4.2.6 | Unified LLM wrapper (`generateText`, `generateObject`) |
| `firebase` | 11.6.0 | Client-side auth & Firestore |
| `firebase-admin` | 13.2.0 | Server-side admin operations |
| `react-hook-form` | 7.54.2 | Form state management |
| `zod` | 3.24.2 | Schema validation & structured outputs |
| `tailwindcss` | 4 | Utility-first CSS |
| `sonner` | 2.0.1 | Toast notifications |
| `lucide-react` | 0.483.0 | Icon library |
| `dayjs` | 1.11.18 | Date formatting |
| `next-themes` | 0.4.6 | Dark mode toggle |

---

## 📝 Environment Variables Required

```env
# Vapi Configuration
NEXT_PUBLIC_VAPI_WEB_TOKEN=<vapi-web-token>
NEXT_PUBLIC_VAPI_WORKFLOW_ID=<vapi-workflow-id>

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=<google-ai-api-key>

# App Base URL
NEXT_PUBLIC_BASE_URL=<app-url>

# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<firebase-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>

# Optional: Firebase Admin (Server-side)
FIREBASE_PRIVATE_KEY=<firebase-private-key>
FIREBASE_CLIENT_EMAIL=<firebase-client-email>
FIREBASE_PROJECT_ID=<firebase-project-id>
```

---

## 🔍 Code Patterns & Conventions

### 1. **Server Actions** (Server-side logic)
- Located in `lib/actions/*.action.ts`
- Marked with `"use server"` directive
- Async functions for database operations
- Used for auth, data persistence, LLM calls

Example:
```typescript
// lib/actions/general.action.ts
export async function createFeedback(params: CreateFeedbackParams) {
    // Server-side Gemini call
    // Firestore write
}
```

### 2. **Client Components** (UI logic)
- Marked with `"use client"` directive
- Handle Vapi SDK interactions
- State management with `useState`, `useEffect`
- Toast notifications for user feedback

Example:
```typescript
// components/Agent.tsx
"use client";
const Agent = ({ ... }: AgentProps) => {
    const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
    // Vapi event listeners
}
```

### 3. **Form Validation**
- Zod schemas for validation
- React Hook Form for state
- Resolver pattern with `@hookform/resolvers/zod`

Example:
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});
const form = useForm({ resolver: zodResolver(schema) });
```

### 4. **Route Segmentation**
- `(auth)` - Public auth routes
- `(root)` - Protected dashboard routes
- Layout wrapping applies auth guards

### 5. **Type Safety**
- TypeScript strict mode enabled
- Interfaces in `types/index.d.ts`
- Vapi types in `types/vapi.d.ts`

---

## 🚀 Development Commands

```bash
npm install                 # Install dependencies
npm run dev                 # Start dev server (Turbopack)
npm run build              # Production build
npm start                  # Production server
npm run lint               # ESLint check
```

---

## 🔗 Key Routes & Pages

| Route | Purpose | Protected |
|-------|---------|-----------|
| `/sign-up` | User registration | ❌ |
| `/sign-in` | User login | ❌ |
| `/` | Dashboard / home | ✅ |
| `/interview` | Create interview | ✅ |
| `/interview/[id]` | Conduct interview | ✅ |
| `/interview/[id]/feedback` | View feedback | ✅ |
| `/api/vapi/generate` | Generate questions | ✅ |
| `/api/logout` | Logout endpoint | ✅ |

---

## 🎯 User Journey

1. **Sign Up / Sign In**
   - New users create account with email/password
   - Existing users log in
   - Session cookie set (1 week)

2. **Dashboard**
   - View past interviews + results
   - View available interviews to practice

3. **Create Interview**
   - Select job role (e.g., "React Developer")
   - Select experience level
   - Select tech stack
   - Choose behavioral vs technical focus
   - System generates role-specific questions

4. **Conduct Interview**
   - Vapi voice agent asks questions
   - User responds verbally
   - Real-time transcript captured
   - Interview stored in Firestore

5. **Receive Feedback**
   - Gemini analyzes performance
   - 5-category scoring system
   - Strengths & improvement areas highlighted
   - Final assessment provided

6. **Logout**
   - Session cookie cleared
   - Redirect to sign-in

---

## 📊 Important Technical Details

### Authentication Flow
- Firebase Auth handles credentials
- Session cookies (not JWTs) for server auth
- `httpOnly` cookies prevent XSS attacks
- 1-week expiration for session security

### Voice Agent Integration
- **Vapi** handles speech-to-text & text-to-speech
- Questions streamed from Firestore
- Interview responses captured as transcripts
- Real-time UI updates via Vapi event listeners

### LLM Integration
- **Gemini 2.0 Flash** for both:
  - Question generation (fast, efficient)
  - Feedback analysis (structured output)
- Vercel AI SDK wraps LLM calls
- Zod schemas ensure consistent JSON responses

### Performance Optimizations
- Turbopack for fast dev builds
- Next.js 15 App Router (server components)
- Parallel data fetching in dashboard
- Cached Firestore queries (implicit)

---

## 🎨 UI/UX Libraries & Styling

- **Tailwind CSS 4** - Utility classes
- **shadcn/ui** - Pre-built components (Button, Form, Input, Label)
- **Lucide React** - 480+ icons
- **Sonner** - Toast notifications (top center)
- **Dark mode** - Enabled by default (`dark` class on `<html>`)
- **Custom font** - Mona Sans (Google Fonts)

---

## 🔒 Security Considerations

1. **Firebase Security Rules** (not in repo, must configure in Firebase console)
   - Only users can read/write their own data
   - Public read for feedback

2. **Environment Variables**
   - `NEXT_PUBLIC_*` exposed to client (intentional for public APIs)
   - Server-side keys never exposed

3. **CORS & API Routes**
   - All LLM calls server-side (no client exposure)
   - Session cookies for auth

4. **Validation**
   - Zod schemas on client & server
   - Firebase validation on write

---

## 📋 Known Limitations & TODOs

1. **Profile URL & Resume** - Properties exist but not implemented
2. **Build Configuration** - ESLint & TypeScript errors ignored during build (see `next.config.ts`)
3. **Feedback ID** - Can be provided or auto-generated (not always clear)
4. **Interview Card** - Missing some data display options

---

## 🤝 Component Dependency Map

```
app/layout.tsx
  ├── LogoutButton
  └── Toaster (Sonner)

app/(root)/page.tsx
  ├── Button (shadcn)
  └── InterviewCard
      ├── DisplayTechIcons
      └── Link

app/(root)/interview/page.tsx
  ├── Form (shadcn)
  ├── FormField
  ├── Input (shadcn)
  └── Button (shadcn)

app/(root)/interview/[id]/page.tsx
  ├── Agent
  │   ├── Vapi SDK
  │   └── Image
  └── Button

components/Agent.tsx
  ├── Vapi (voice agent)
  ├── useRouter
  └── useEffect/useState

components/AuthForm.tsx
  ├── Form (shadcn)
  ├── FormField
  ├── Button (shadcn)
  ├── Firebase Auth
  └── useRouter
```

---

## 📈 Future Enhancement Opportunities

1. **Profile Completion** - Add resume upload & profile picture
2. **Interview Scheduling** - Calendar integration
3. **Performance Analytics** - Track improvement over time
4. **Question Bank** - User-submitted interview questions
5. **Export Feedback** - PDF reports
6. **Community Features** - Share & compare results
7. **Mobile App** - React Native version
8. **Caching** - Interview question caching
9. **A/B Testing** - Different prompt variations
10. **Admin Dashboard** - User management & analytics

---

**Last Updated:** April 24, 2026  
**Project Version:** 0.1.0  
**Status:** Active Development
