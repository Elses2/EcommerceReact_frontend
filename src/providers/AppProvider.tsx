import type { ReactNode } from 'react';

/**
 * Props for the AppProvider.
 * @prop children - Child components to wrap
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * App-level provider that wraps the application with shared context.
 * Currently a pass-through; extended in later PRs with auth/cart providers.
 * @param props - AppProviderProps
 */
export function AppProvider({ children }: AppProviderProps) {
  return <>{children}</>;
}
