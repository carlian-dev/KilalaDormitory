// Profile and identity helpers

/**
 * Format a student or staff full name to display only their first and last name.
 * e.g., "Carl Ian Pepito" -> "Carl Pepito"
 * e.g., "Juan Dela Cruz" -> "Juan Cruz"
 * e.g., "Carl" -> "Carl"
 */
export function formatFirstAndLastName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Extract profile picture URL from Supabase Auth user object
 * (Google Workspace OAuth sets avatar_url or picture).
 */
export function getUserAvatarUrl(user) {
  if (!user) return null;
  return (
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture ||
    null
  );
}
