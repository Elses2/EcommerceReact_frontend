import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";

interface AppProviderProps {
  children: ReactNode;
}

/**
 * App-level provider that wraps the application with shared context.
 * Includes AuthProvider for session management and CartProvider for
 * shopping-cart state (spec §24.2).
 * @param props - AppProviderProps
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
