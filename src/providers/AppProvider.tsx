import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";

interface AppProviderProps {
  children: ReactNode;
}

/**
 * App-level provider that wraps the application with shared context.
 * Currently includes AuthProvider for session management.
 * @param props - AppProviderProps
 */
export function AppProvider({ children }: AppProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
