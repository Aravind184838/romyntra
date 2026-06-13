# Romyntra Dating App

Welcome to the **Romyntra Dating App** repository! This is an AI-powered dating application with a rich frontend built with React/Vite and a robust Node.js/Express backend.

## 🗺️ Application User Flow

GitHub automatically renders Mermaid flowcharts! Here is the high-level user journey through the application:

```mermaid
graph TD
    Splash[Splash Screen] --> AuthCheck{User Logged In?}
    AuthCheck -->|No| LoginSignup[Login / Signup Page]
    LoginSignup --> OTP[OTP / Email Verification]
    OTP --> Setup[Profile Setup & Preferences]
    Setup --> Discover
    
    AuthCheck -->|Yes| Discover[Discover & Swipe]
    
    Discover --> Matches[View Matches]
    Matches --> Chat[Real-time Chat]
    
    Discover --> Profile[Profile & Settings]
    Profile --> Logout[Logout]
    Logout --> LoginSignup
```

## 🏗️ System Architecture

```mermaid
graph LR
    Client[Frontend Client\nReact + Vite] <-->|REST & WebSockets| Server[Backend API\nNode.js + Express]
    
    Server <--> DB[(MongoDB\nUser Data & Swipes)]
    Server <--> Auth[Firebase Auth\nAuthentication]
    Server <--> SMS[SMS Provider\nTwilio API]
```

## 🚀 CI/CD Pipeline

This project uses **GitHub Actions** for automated testing:

```mermaid
graph LR
    Push[Push to main] --> Checkout[Checkout Code]
    Checkout --> SetupNode[Setup Node & Python]
    SetupNode --> InstallDeps[Install Dependencies]
    InstallDeps --> StartServers[Start Backend & Frontend]
    StartServers --> RunTests[Run Selenium E2E Tests]
    RunTests --> Report[Generate HTML Report Artifact]
```

## Running Locally

1. Install backend dependencies: `cd backend && npm install`
2. Start backend server: `npm run dev`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start frontend server: `npm run dev`
