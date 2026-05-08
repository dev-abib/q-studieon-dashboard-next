import { Admin } from "@/features/admin/types/admin.types";
import { create } from "zustand";

type AuthState = {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  clearAdmin: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  admin: null,

  setAdmin: admin => set({ admin }),

  clearAdmin: () => set({ admin: null }),
}));
