/**
 * RequireAuth — route guard that prevents rendering children until the
 * auth status is resolved. While status is `"loading"` it renders nothing
 * (never children with unresolved auth — S13 parity principle). When the
 * user is a guest it redirects to `/login?next=<intended path>`; when
 * authenticated it renders `children`.
 *
 * @spec (spec §23.3, §23.4)
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Route guard component. Blocks rendering of children until auth is
 * resolved; redirects guests to `/login?next=<current path>`.
 * @param props - RequireAuthProps with `children` to guard
 * @returns `null` while loading, a `<Navigate>` for guests, or `children` for authenticated users
 * @spec (spec §23.3, §23.4)
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();
  const location = useLocation();

  // S13 rule: never render children with unresolved auth
  if (status === "loading") {
    return null;
  }

  if (status === "guest") {
    const next =
      location.pathname + location.search + location.hash;
    // Redirect to login, preserving the intended route as `next`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  // status === "authenticated"
  return <>{children}</>;
}
