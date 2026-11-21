import React, { type ReactNode } from 'react';

/**
 * Props for the Breadcrumb molecule.
 * @prop back - Optional back link with href and label.
 * @prop items - Ordered breadcrumb items; each has a label and an optional href.
 * @spec (spec §3, molecules/breadcrumb.ejs)
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  back?: { href: string; label: string };
  items?: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation molecule: "← Volver al Listado > Category" pattern.
 * Purely presentational.
 * Mirrors the monolith EJS partial `molecules/breadcrumb.ejs` (spec §3).
 * @param props - BreadcrumbProps
 * @spec (spec §3, molecules/breadcrumb.ejs)
 */
export function Breadcrumb({ back, items = [] }: BreadcrumbProps): ReactNode {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
      {back && (
        <a
          href={back.href}
          className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-brand"
        >
          ← {back.label}
        </a>
      )}
      {items.map((item, index) => (
        <React.Fragment key={`${index}-${item.label}`}>
          {index > 0 || back ? (
            <span aria-hidden="true">›</span>
          ) : null}
          {item.href ? (
            <a href={item.href} className="transition-colors hover:text-brand">
              {item.label}
            </a>
          ) : (
            <span aria-current="page" className="text-ink">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
