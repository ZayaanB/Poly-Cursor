/** FastAPI orchestrator endpoint (SSE). Override with Vite env in production. */
export const GENERATE_APP_URL =
  import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://localhost:8000/generate-app";
