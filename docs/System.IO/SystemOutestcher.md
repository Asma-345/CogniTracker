# SystemOutestcher (System.IO.Orchestrator)

## Architectural Role
The **SystemOutestcher** serves as the primary data orchestrator within the Kinetic Scan ecosystem. It "outstretches" the local browser's telemetry data into the cloud-based AI inference engine.

## Logic Flow
1. **Ingestion**: Intercepts DOM `KeyDown` and `KeyUp` events via high-resolution `Performance.now()` hooks.
2. **Standardization**: Normalizes raw timing into three distinct vectors:
    - **MFL (Mean Flight Latency)**: The gap between keys (Processing speed).
    - **MDD (Mean Dwell Duration)**: The duration a key is held (Motor persistence).
    - **CoV (Coefficient of Variation)**: The rhythmic consistency (Executive health).
3. **Transport**: Encapsulates the vector into a secure JSON payload.
4. **Relay**: Communicates with the Vercel-hosted serverless function to prevent the exposure of the Groq API Key on the client side.

## Why this is Secure
By using the **SystemOutestcher** pattern, we ensure that clinical data is processed in a stateless environment, maintaining user privacy while delivering AI-powered diagnostics.
