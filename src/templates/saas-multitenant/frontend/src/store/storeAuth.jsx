import { create } from "zustand";
import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const useStoreAuth = create(() => ({
  apiBase: API_BASE,
  client: createAuthClient({
    baseURL: `${API_BASE}/api/auth/`,
    plugins: [organizationClient(), adminClient()],
  }),
}));
