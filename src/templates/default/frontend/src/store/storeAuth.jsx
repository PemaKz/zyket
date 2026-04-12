import { create } from "zustand";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"

export const useStoreAuth = create((set) => ({
  client: createAuthClient({
    plugins: [
        adminClient()
    ],
    baseURL: `${import.meta.env.VITE_API_BASE}/api/auth/`,
  }),

  setClient: (client) => set({ client }),
}));
