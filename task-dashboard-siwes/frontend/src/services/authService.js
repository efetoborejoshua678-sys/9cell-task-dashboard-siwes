import { supabase } from '../lib/supabase';

/**
 * Sign in existing user with email and password via Supabase Auth.
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Register new user with email and password via Supabase Auth.
 */
export async function register(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sign out current user via Supabase Auth.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Retrieve current active user session.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Retrieve current active user.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if a user session is active.
 */
export async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session);
}

/**
 * Helper to subscribe to auth changes.
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
