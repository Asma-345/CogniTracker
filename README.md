# Kinetic Scan: Neuro-Kinetic Fatigue Monitor

## 🧠 Overview
Kinetic Scan is an AI-powered diagnostic tool designed to detect **Acute Cognitive Bradyphrenia** (mental slowing) through digital biomarkers. By analyzing high-resolution typing telemetry, the system identifies the subtle timing patterns that indicate cognitive fatigue before it affects performance.

## 🚀 Live Application
**Live Demo**: [https://cognito-tracker.vercel.app](https://cognito-tracker.vercel.app)

## 🛠️ System Architecture
The project follows a decoupled, low-latency architecture designed for millisecond-precision data processing:

1.  **Telemetry Collector (Frontend)**: A React-based engine using `performance.now()` hooks to capture key-down and key-up events with <1ms accuracy.
2.  **SystemOutestcher (Orchestrator)**: A custom internal module (`System.IO.Orchestrator`) that normalizes raw timing into three distinct vectors:
    - **Mean Flight Latency (MFL)**: Processing speed.
    - **Mean Dwell Duration (MDD)**: Motor persistence.
    - **Coefficient of Variation (CoV)**: Rhythmic consistency.
3.  **Secure AI Relay (Backend)**: A Vercel Serverless Function that acts as a secure proxy, protecting the Groq API credentials while routing data to the AI engine.
4.  **Neural Inference (Groq + Llama 3)**: Utilizing the Llama 3-8b model via the Groq SDK for near-instantaneous pattern recognition and fatigue scoring.
5.  **Analytics Dashboard**: Real-time visualization using Recharts to display comparative metrics against the user's calibration baseline.

## 💡 AI Integration
The core intelligence of Kinetic Scan is powered by the **Groq SDK** and **Meta's Llama 3** model. Unlike simple threshold-based logic, our AI integration performs a "Micro-Neurological Assessment" by comparing live typing rhythms against a unique user baseline. It calculates a 0-100 Fatigue Score by analyzing "Rhythmic Decomposition"—the loss of typing rhythm that occurs during early-stage mental exhaustion.

## 📦 Tech Stack
- **Languages**: TypeScript, Node.js
- **Frameworks**: React 18 (Vite), Tailwind CSS
- **APIs**: Vercel Serverless, Groq Cloud (Llama3-8b-8192)
- **Monitoring**: Performance API (Web Standard)

## 🤝 Team: ANB Squad
- **Team Lead**: Asma Khalid
- **Project Name**: Kinetic Scan
