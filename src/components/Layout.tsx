import { useAuth } from '../providers/AuthProvider';
import { Header } from '../organisms/Header';
import { Footer } from '../organisms/Footer';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component: wraps pages with Header, <main>, and Footer.
 * Sets `data-logged-in` on the root element ONLY when auth status is
 * "authenticated" or "guest" — NEVER while "loading" (attribute omitted),
 * per the S13 data-* contract (spec §5). Mirrors the monolith EJS layout
 * `templates/layout.ejs` where data-logged-in lives on <body>.
 * @param props - LayoutProps with children to render inside <main>
 * @spec (spec §5, §6.14, templates/layout.ejs)
 */
export function Layout({ children }: LayoutProps): ReactNode {
  const { status } = useAuth();

  const dataLoggedIn =
    status === 'authenticated'
      ? 'true'
      : status === 'guest'
        ? 'false'
        : undefined;

  return (
    <div data-logged-in={dataLoggedIn}>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
