import type { ReactNode } from 'react';

/**
 * Props for the ProfilePic atom.
 * @prop src - URL of the profile image (optional).
 * @prop name - User name used for the initial fallback and alt text.
 * @prop alt - Override alt text (defaults to the user name).
 * @spec (spec §3, atoms/profile-pic.ejs)
 */
interface ProfilePicProps {
  src?: string;
  name?: string;
  alt?: string;
}

/**
 * Circular profile picture atom with automatic fallback to the user's
 * initial when no image URL is provided. Purely presentational.
 * @param props - ProfilePicProps
 * @spec (spec §3, atoms/profile-pic.ejs)
 */
export function ProfilePic({ src, name, alt }: ProfilePicProps): ReactNode {
  const picSrc = typeof src === 'string' && src ? src : '';
  const picName = typeof name === 'string' && name.trim() ? name.trim() : '';
  const picAlt = typeof alt === 'string' && alt ? alt : picName;

  if (picSrc) {
    return (
      <img
        src={picSrc}
        alt={picAlt}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-graphite text-xs font-semibold text-white ring-2 ring-white"
      aria-hidden="true"
    >
      {picName.charAt(0).toUpperCase()}
    </span>
  );
}
