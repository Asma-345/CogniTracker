# Kinetic Scan System Design

## 1. Executive Summary
Kinetic Scan is a high-fidelity motor-kinetic assessment platform. It uses biometric typing patterns (Keystroke Dynamics) to detect micro-variations in cognitive load and neuromuscular fatigue. The system compares real-time data against a stable baseline to calculate a "Neuro-Kinetic Fatigue Score."

## 2. Technical Architecture

### 2.1 Front-End Data Acquisition
- **Event Listeners**: Utilizes low-level `keydown` and `keyup` events.
- **Timing Engine**: Employs `performance.now()` for sub-millisecond precision.
- **Metrics Extracted**:
  - **Dwell Time (DT)**: `KeyUp(n) - KeyDown(n)` (Indicates motor speed).
  - **Flight Time (FT)**: `KeyDown(n) - KeyUp(n-1)` (Indicates processing delay).
  - **Jitter**: Variance in FT (Indicates rhythmic stability).

### 2.2 Neural Analysis Layer
- **Interface**: Groq SDK (Llama 3-8b-8192).
- **Relay Pattern**: Frontend sends telemetry to a backend Express endpoint (`/api/analyze`), which proxies the request to Groq Cloud.
- **Payload Structure**: JSON-encoded kinetic vectors (Means, Standard Deviations, Error Rates).
- **Inference Model**: AI performs a differential analysis between the Baseline and Current telemetry. It identifies "Temporal Drift" and "Rhythmic Decomposition" indicative of acute fatigue.

### 2.3 Data Presentation
- **Visuals**: Recharts (Line & Area charts).
- **History**: LocalStorage-backed session tracking for longitudinal trend analysis.

## 3. Data Flow Diagram
1. **User Input** → 2. **Raw Timestamps** → 3. **Metric Normalization** → 4. **AI Inference Relay** → 5. **Fatigue Intelligence Report** → 6. **Dashboard Visualization**.

## 4. Security & Privacy
- **Client-Side Processing**: Raw keystroke values (the actual letters) are never sent to the AI; only the timing intervals are transmitted to preserve privacy.
- **Credential Protection**: API keys are isolated in server-side environment variables.

## 5. Deployment Strategy
- **Platform**: Vercel (CD/CI via GitHub Integration).
- **Environment**: Edge-compatible React SPA.
- **Scaling**: Serverless architecture ensures zero-maintenance scaling.
