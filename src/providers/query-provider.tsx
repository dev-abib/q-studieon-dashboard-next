"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeAccentProvider } from "./theme-accent-provider";

export const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeAccentProvider>{children}</ThemeAccentProvider>
    </QueryClientProvider>
  );
}
