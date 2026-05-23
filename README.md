# 🎤 PrepRise — AI-Powered Interview Preparation Platform

<div align="center">

<img src="logo.svg" alt="PrepRise Banner" />

<br />

![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white)
![Vapi AI](https://img.shields.io/badge/Vapi_AI-5dfeca?style=for-the-badge&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

### Practice smarter with AI-driven mock interviews, voice interaction, and instant feedback.

[Live Demo](https://prep-rise.vercel.app/) • [Report Bug](https://github.com/Ayush0115D/prep-rise/issues) • [Request Feature](https://github.com/Ayush0115D/prep-rise/issues)

</div>

---

## 📌 Overview

**PrepRise** is an AI-powered interview preparation platform designed to simulate real interview experiences using intelligent voice agents.

Built with **Next.js**, **Firebase**, and **Vapi AI**, the platform allows users to create personalized mock interviews, interact with AI interviewers in real time, and receive detailed AI-generated feedback to improve performance and confidence.

---

## ⚙️ Tech Stack

### Frontend
- Next.js
- Tailwind CSS
- shadcn/ui

### Backend & Services
- Firebase Authentication
- Firebase Firestore

### AI & Voice
- Vapi AI
- Google Gemini
d

---

## ✨ Features

### 🔐 Authentication
Secure user authentication using Firebase email/password login system.

### 🤖 AI Interview Generation
Generate personalized interviews based on job role and technical stack.

### 🎙️ Voice-Based AI Interviews
Practice interviews with real-time conversational AI voice agents powered by Vapi.

### 📊 Instant Feedback System
Receive AI-generated feedback, performance analysis, and interview transcripts after each session.

### 📁 Dashboard Management
Track and manage all completed interviews from a centralized dashboard.

### 📱 Responsive UI
Fully responsive modern interface optimized for all screen sizes.

### 🧩 Clean Architecture
Scalable and reusable code architecture for maintainability and performance.

---

## 🚀 Live Demo

👉 **Production URL:**  
https://prep-rise.vercel.app/

---



# 🤸 Quick Start

Follow these steps to set up the project locally on your machine.

---

## 📋 Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

---

## 📥 Clone Repository

```bash
git clone git@github.com:Ayush0115D/prep-rise.git
cd prep-rise
```

---

## 📦 Install Dependencies

```bash
npm install
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=

GOOGLE_GENERATIVE_AI_API_KEY=

NEXT_PUBLIC_BASE_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Replace all placeholder values with your actual credentials from:
- Firebase
- Vapi AI
- Google Gemini

---

## ▶️ Run Development Server

```bash
npm run dev
```

Open your browser and visit:

```bash
http://localhost:3000
```

---

# 📂 Project Structure

```bash
prep-rise/
│
├── app/                 # App router pages
├── components/          # Reusable UI components
├── constants/           # Static constants
├── firebase/            # Firebase configuration
├── lib/                 # Utility functions
├── public/              # Static assets
├── styles/              # Global styles
├── types/               # TypeScript types
│
├── .env.local
├── package.json
└── README.md
```

---

# 🛠️ Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---


# 🤝 Contributing

Contributions are welcome!

If you'd like to contribute:

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes

```bash
git commit -m "Add your message"
```

4. Push to the branch

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request

---



<div align="center">

### ⭐ If you found this project helpful, consider giving it a star on GitHub!

</div>
