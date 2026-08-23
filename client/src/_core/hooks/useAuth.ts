type PortableUser = {
  name?: string | null;
  email?: string | null;
};

/**
 * The Vercel build is a public, browser-local editor: it does not require
 * Manus OAuth or a session cookie. This retained hook keeps optional template
 * consumers type-safe without triggering a provider-specific login flow.
 */
export function useAuth() {
  return {
    user: null as PortableUser | null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: async () => undefined,
    logout: async () => undefined,
  };
}
