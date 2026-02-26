// Per-user preference persistence via localStorage.
// All keys are namespaced by email so multiple accounts on
// the same device don't clobber each other.

const NS = 'nebula_prefs_';

/**
 * Persist all saveable preferences for a user.
 * @param {string} email
 * @param {object} prefs
 */
export const savePrefs = (email, prefs) => {
  if (!email) return;
  try {
    localStorage.setItem(NS + email, JSON.stringify(prefs));
  } catch (e) {
    // Silently ignore storage quota errors
  }
};

/**
 * Load persisted preferences for a user.
 * Returns null if nothing has been saved yet.
 * @param {string} email
 * @returns {object|null}
 */
export const loadPrefs = (email) => {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(NS + email);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Remove saved preferences for a user (e.g. on account deletion).
 * Does NOT remove on normal logout — saved prefs survive logout
 * so they're restored on next login.
 * @param {string} email
 */
export const clearPrefs = (email) => {
  if (!email) return;
  try {
    localStorage.removeItem(NS + email);
  } catch (e) {}
};
