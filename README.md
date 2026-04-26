# Kinetic Scan: Neuro-Kinetic Fatigue Monitor

## 🧠 Overview
Kinetic Scan is a professional neuro-ergonomic assessment tool designed to detect **Acute Cognitive Fatigue** through digital biomarkers. By analyzing high-resolution typing telemetry (Keystroke Dynamics), the system identifies subtle timing patterns—"Rhythmic Decomposition"—that indicate mental exhaustion before it impacts critical performance.

## 🚀 Key Features
- **Real-time Telemetry**: High-precision capture of Flight Time (FT) and Dwell Time (DT).
- **Neural Analysis**: Powered by Google Gemini AI for advanced pattern recognition.
- **Baseline Comparison**: Scientific evaluation against personalized "Rested" profiles.
- **Visual Analytics**: Interactive data visualization of motor-kinetic trends.

## 🛠️ System Architecture
The project follows a low-latency architecture designed for millisecond-precision data processing:

1.  **Kinetic Capture (Frontend)**: A React-based engine using `performance.now()` to capture key events with <1ms accuracy.
2.  **Telemetry Processor**: A custom processing layer that normalizes raw timing into:
    - **Flight Time (FT)**: Latency between keys (Processing speed).
    - **Dwell Time (DT)**: Duration a key is held (Motor persistence).
    - **FT Jitter**: Standard deviation of flight times (Rhythmic consistency).
3.  **Neural Inference (Gemini AI)**: Utilizing `gemini-1.5-flash` for multi-vector kinetic analysis and fatigue scoring.
4.  **Analytics Layer**: Real-time visualization using Recharts to display comparative metrics.

## 💡 AI Integration
The core intelligence is powered by the **Google Gemini API**. Unlike simple threshold logic, the AI performs a "Neuro-Kinetic Assessment" by comparing live typing rhythms against a unique user baseline. It identifies "Rhythmic Decomposition"—the loss of typing rhythm that occurs during early-stage mental exhaustion.

## 📦 Tech Stack
- **Languages**: TypeScript, Node.js
- **Frameworks**: React 19, Tailwind CSS 4, Motion
- **APIs**: Groq SDK (Llama 3-8b-8192) via Secure Express Proxy
- **Visualization**: Recharts, Lucide React
- **Runtime**: Vite + Express (Full-Stack)

## 🚀 Deployment Guide (GitHub + Vercel)

Follow these steps to deploy your own version:

### 1. GitHub Setup
1. Create a new repository on GitHub.
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

### 2. Vercel Deployment
1. Go to [Vercel](https://vercel.com) and import your GitHub repository.
2. **Environment Variables**: In the Vercel project settings, add the following:
   - `GROQ_API_KEY`: Your key from [Groq Cloud](https://console.groq.com/keys).
   - `NODE_ENV`: `production`
3. **Build Settings**: Vercel will automatically detect the Vite build.
4. Click **Deploy**.

## 🤝 Project Info
- **Developer**: Asma Khalid
- **Status**: Production-Ready / Neuro-Ergonomic Assessment Tool
- **Security**: All API keys are protected on the server side using an Express proxy.
