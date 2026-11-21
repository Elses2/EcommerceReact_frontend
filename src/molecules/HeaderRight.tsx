import type { ReactNode } from 'react';
import { CartIcon } from './CartIcon';
import { ProfileBtn } from './ProfileBtn';

/**
 * Props for the HeaderRight molecule.
 * @prop cartCount - Cart item count passed to CartIcon.
 * @prop user - Authenticated user object (name used for ProfileBtn).
 * @prop onLogout - Callback invoked when the logout button is clicked.
 * @spec (spec §3, molecules/header-right.ejs)
 */
interface HeaderRightProps {
  cartCount?: number;
  user?: { name: string } | null;
  onLogout?: () => void;
}

/**
 * Right-side header cluster molecule: CartIcon + ProfileBtn +
 * an optional logout button. Purely presentational.
 * Mirrors the monolith EJS partial `molecules/header-right.ejs` (spec §3).
 * Preserves the `data-auth-logout` attribute on the logout button.
 * @param props - HeaderRightProps
 * @spec (spec §3, molecules/header-right.ejs)
 */
export function HeaderRight({ cartCount, user, onLogout }: HeaderRightProps): ReactNode {
  const rightCartCount =
    typeof cartCount === 'number' && cartCount >= 0 ? cartCount : 0;
  const rightUser = typeof user === 'object' && user !== null ? user : null;
  const profileName =
    rightUser && typeof rightUser.name === 'string' ? rightUser.name : '';
  const profileHref = rightUser ? '#' : '/login';

  return (
    <div className="flex shrink-0 items-center gap-2">
      <CartIcon count={rightCartCount} />
      <ProfileBtn name={profileName} href={profileHref} />
      {rightUser && (
        <button
          type="button"
          data-auth-logout=""
          className="rounded-full px-2 text-sm text-graphite underline-offset-2 hover:underline"
          onClick={onLogout}
        >
          Salir
        </button>
      )}
    </div>
  );
}
