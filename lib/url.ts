/**
 * Utility to get the correct base URL for the environment.
 * Prioritizes production site URL, then falls back to window.location.origin, then localhost.
 */
export function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Defined in Vercel environment variables
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel for previews
    'http://localhost:3000'

  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`
  
  // Client-side fallback to current origin
  if (typeof window !== 'undefined' && window.location.origin) {
    url = window.location.origin
  }

  // Remove trailing slash
  return url.replace(/\/$/, '')
}
