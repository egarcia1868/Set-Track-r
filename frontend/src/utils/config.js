export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://set-trackr-backend.onrender.com" // Deployed backend URL
    : "http://localhost:4000"; // Local backend URL (adjust port if needed)
