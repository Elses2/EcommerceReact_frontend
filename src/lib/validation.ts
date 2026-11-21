/**
 * Client-side validation helpers shared by the auth pages. They mirror the
 * backend rules so the user gets immediate feedback; the backend remains the
 * source of truth (its field errors are surfaced per-field by the pages).
 *
 * @spec (spec §6.3, §23.2)
 */

import type { FieldErrors } from "./api";

/** Email format accepted by the backend (§6.3): local@domain.tld. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Password length bounds from spec §6.3 (backend enforces the same). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Raw values of the registration form. */
export interface RegistrationInput {
  name: string;
  lastname: string;
  email: string;
  password: string;
}

/** Raw values of the login form. */
export interface CredentialsInput {
  email: string;
  password: string;
}

/**
 * Validates the registration form per §6.3: name and lastname required
 * (non-empty, not whitespace-only), valid email format, password length
 * within [PASSWORD_MIN, PASSWORD_MAX].
 *
 * @param {RegistrationInput} input - Raw (untrimmed) form values.
 * @returns {FieldErrors} Field-keyed error lists; empty object when valid.
 */
export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) {
    errors.name = ["Name is required"];
  }

  if (!input.lastname.trim()) {
    errors.lastname = ["Last name is required"];
  }

  if (!input.email.trim()) {
    errors.email = ["Email is required"];
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = ["Email format is invalid"];
  }

  if (!input.password) {
    errors.password = ["Password is required"];
  } else if (
    input.password.length < PASSWORD_MIN ||
    input.password.length > PASSWORD_MAX
  ) {
    errors.password = [
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`,
    ];
  }

  return errors;
}

/**
 * Validates the login form per §6.3: email required with valid format,
 * password required (length is not re-checked here: a wrong-length password
 * is simply a failed login, reported by the backend as 401).
 *
 * @param {CredentialsInput} input - Raw (untrimmed) form values.
 * @returns {FieldErrors} Field-keyed error lists; empty object when valid.
 */
export function validateCredentials(input: CredentialsInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.email.trim()) {
    errors.email = ["Email is required"];
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = ["Email format is invalid"];
  }

  if (!input.password) {
    errors.password = ["Password is required"];
  }

  return errors;
}
