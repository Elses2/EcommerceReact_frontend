import type { ReactNode } from 'react';
import { ProfilePic } from '../atoms/ProfilePic';

/**
 * Props for the ProfileBtn molecule.
 * @prop name - User display name (defaults to "Invitado").
 * @prop href - Navigation URL (defaults to "/login").
 * @spec (spec §3, molecules/profile-btn.ejs)
 */
interface ProfileBtnProps {
  name?: string;
  href?: string;
}

/**
 * Profile button molecule: a graphite pill with the ProfilePic atom
 * and the user's name. Purely presentational.
 * Mirrors the monolith EJS partial `molecules/profile-btn.ejs` (spec §3).
 * @param props - ProfileBtnProps
 * @spec (spec §3, molecules/profile-btn.ejs)
 */
export function ProfileBtn({ name, href }: ProfileBtnProps): ReactNode {
  const profileName =
    typeof name === 'string' && name.trim() ? name.trim() : 'Invitado';
  const profileHref = typeof href === 'string' && href ? href : '/login';

  return (
    <a
      href={profileHref}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-graphite pl-1.5 pr-4 text-white transition-colors hover:bg-graphite/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
      aria-label={`Perfil de ${profileName}`}
    >
      <ProfilePic name={profileName} />
      <span className="text-sm">{profileName}</span>
    </a>
  );
}
