import type { ReactNode } from 'react';

/**
 * Props for the BadgeCounter atom.
 * @prop count - Numeric badge value (defaults to 0).
 * @spec (spec §3, atoms/badge-counter.ejs)
 */
interface BadgeCounterProps {
  count?: number;
}

/**
 * Red numeric badge atom for the cart counter. Purely presentational.
 * Preserves the `data-cart-count` attribute from the monolith EJS partial.
 * @param props - BadgeCounterProps
 * @spec (spec §3, atoms/badge-counter.ejs)
 */
export function BadgeCounter({ count = 0 }: BadgeCounterProps): ReactNode {
  const badgeCount = typeof count === 'number' && count >= 0 ? count : 0;

  return (
    <span
      data-cart-count={badgeCount}
      aria-hidden="true"
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
    >
      {badgeCount}
    </span>
  );
}
