import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { SearchBar } from '../molecules/SearchBar';
import { HeaderRight } from '../molecules/HeaderRight';
import { CategoryNav } from './CategoryNav';

/**
 * Props for Header organism.
 * @prop cartCount - Cart item count (defaults to 0; F3 hydrates from API).
 * @spec (spec §3, §6.6b, organisms/header.ejs)
 */
interface HeaderProps {
  cartCount?: number;
}

/**
 * Header organism: logo link home, SearchBar, CategoryNav, and HeaderRight
 * wired with AuthProvider (user + logout callback). Mirrors the monolith
 * EJS partial `organisms/header.ejs` (spec §3).
 * @param props - HeaderProps
 * @spec (spec §3, §6.6b, organisms/header.ejs)
 */
export function Header({ cartCount = 0 }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(query ? { query } : {});
      navigate(`/products?${params.toString()}`);
    },
    [navigate],
  );

  return (
    <>
      <header className="hidden md:block">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-6 px-4 md:px-6 lg:px-8">
          <a
            href="/"
            className="shrink-0 text-2xl leading-none text-brand"
            aria-label="MiEcommerce, ir a la página de inicio"
          >
            <span className="font-bold">Mi</span>
            <span className="font-light">Ecommerce</span>
          </a>
          <div className="min-w-0 flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          <HeaderRight cartCount={cartCount} user={user ?? null} onLogout={logout} />
        </div>
      </header>
      <CategoryNav />
    </>
  );
}
