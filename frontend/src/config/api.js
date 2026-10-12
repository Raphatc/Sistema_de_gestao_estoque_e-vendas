// URL do backend em produção (Render).
// Para desenvolvimento local, crie frontend/.env.local com:
// NEXT_PUBLIC_API_URL=http://localhost:8080
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://tabacaria-system.onrender.com';
