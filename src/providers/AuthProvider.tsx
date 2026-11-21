import React,
  { createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { api, type User } from "../lib/api";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "guest";
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    lastname: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component. Wraps the app (or a subtree) to make auth
 * state and actions available via `useAuth()`.
 * @param props - AuthProviderProps
 * @spec (spec §23.2, §23.4)
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    status: "loading",
  });

  // Resolve session once on mount via GET /api/auth/me (spec §23.2)
  useEffect(() => {
    let cancelled = false;

    api
      .get<User>("/auth/me")
      .then((user) => {
        if (!cancelled) setState({ user, status: "authenticated" });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, status: "guest" });
      })
      .finally(() => {
        if (!cancelled) {
          // Auth resolved — subsequent 401s are handled by the API client's
          // default automatic redirect-to-login (window.location, spec §23.4).
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await api.post<User>("/auth/login", { email, password });
      setState({ user, status: "authenticated" });
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      navigate(next ? decodeURIComponent(next) : "/", { replace: true });
    },
    [navigate],
  );

  const register = useCallback(
    async (
      name: string,
      lastname: string,
      email: string,
      password: string,
    ) => {
      await api.post("/auth/register", { name, lastname, email, password });
      // After successful registration, log the user in
      const user = await api.post<User>("/auth/login", { email, password });
      setState({ user, status: "authenticated" });
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      navigate(next ? decodeURIComponent(next) : "/", { replace: true });
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setState({ user: null, status: "guest" });
    navigate("/");
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to access the auth context. Must be used within an `AuthProvider`.
 * @returns AuthContextType with `user`, `status`, `login`, `register`, `logout`
 * @spec (spec §23.2, §23.4)
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
