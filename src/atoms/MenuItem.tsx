import type { ReactNode } from 'react';

/**
 * Props for the MenuItem atom.
 * @prop label - Display text (required).
 * @prop href - URL destination; when omitted renders a `<button>` instead of `<a>`.
 * @prop icon - Raw SVG string for the icon (rendered with aria-hidden).
 * @prop active - Marks the item as active with `aria-current="page"` and brand styling.
 * @spec (spec §3, atoms/menu-item.ejs)
 */
interface MenuItemProps {
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
}

/**
 * Single menu item atom that renders as `<a>` when `href` is provided,
 * or as `<button type="button">` otherwise. Purely presentational.
 * @param props - MenuItemProps
 * @spec (spec §3, atoms/menu-item.ejs)
 */
export function MenuItem({ label, href, icon, active = false }: MenuItemProps): ReactNode {
  const itemLabel = typeof label === 'string' ? label : '';
  const itemHref = typeof href === 'string' && href ? href : '';
  const itemIcon = typeof icon === 'string' && icon ? icon : '';
  const itemActive = active;

  const menuItemClasses = [
    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    itemActive
      ? 'bg-brand/10 font-medium text-brand'
      : 'text-graphite hover:bg-neutral-100 hover:text-ink',
  ].join(' ');

  if (itemHref) {
    return (
      <a
        href={itemHref}
        className={menuItemClasses}
        {...(itemActive ? { 'aria-current': 'page' } : {})}
      >
        {itemIcon && (
          <span className="[&_svg]:h-4 [&_svg]:w-4" aria-hidden="true" dangerouslySetInnerHTML={{ __html: itemIcon }} />
        )}
        <span>{itemLabel}</span>
      </a>
    );
  }

  return (
    <button type="button" className={menuItemClasses}>
      {itemIcon && (
        <span className="[&_svg]:h-4 [&_svg]:w-4" aria-hidden="true" dangerouslySetInnerHTML={{ __html: itemIcon }} />
      )}
      <span>{itemLabel}</span>
    </button>
  );
}
