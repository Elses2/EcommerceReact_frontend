/**
 * Unit tests for §6.3 validation rules (boundary checks, empty fields,
 * bad email). These tests exercise the validation logic used by the
 * Register and Login pages.
 *
 * @spec (spec §6.3)
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Thin adapters so every assertion below exercises the REAL shared module
// (src/lib/validation.ts) used by the Login and Register pages — not a copy.
// ---------------------------------------------------------------------------

import { validateCredentials, validateRegistration } from "./validation";

function validateLogin(email: string, password: string) {
  return validateCredentials({ email, password });
}

function validateRegister(
  name: string,
  lastname: string,
  email: string,
  password: string,
) {
  return validateRegistration({ name, lastname, email, password });
}

// ---------------------------------------------------------------------------
// Login validation tests
// ---------------------------------------------------------------------------

describe("Login validation (§6.3, via src/lib/validation.ts)", () => {
  it("passes with valid email and password", () => {
    expect(validateLogin("user@example.com", "password123")).toEqual({});
  });

  it("fails with empty email", () => {
    expect(validateLogin("", "password123")).toEqual({
      email: ["Email is required"],
    });
  });

  it("fails with empty password", () => {
    expect(validateLogin("user@example.com", "")).toEqual({
      password: ["Password is required"],
    });
  });

  it("fails with whitespace-only email", () => {
    expect(validateLogin("   ", "password123")).toEqual({
      email: ["Email is required"],
    });
  });

  it("fails with bad email format", () => {
    expect(validateLogin("not-an-email", "password123")).toEqual({
      email: ["Email format is invalid"],
    });
  });

  it("fails with missing @", () => {
    expect(validateLogin("userexample.com", "password123")).toEqual({
      email: ["Email format is invalid"],
    });
  });
});

// ---------------------------------------------------------------------------
// Register validation tests — §6.3 boundary checks
// ---------------------------------------------------------------------------

describe("Register validation (§6.3 mirror)", () => {
  it("passes with all valid fields", () => {
    expect(
      validateRegister("John", "Doe", "john@example.com", "password123!"),
    ).toEqual({});
  });

  it("fails with empty name", () => {
    expect(
      validateRegister("", "Doe", "john@example.com", "password123!"),
    ).toEqual({ name: ["Name is required"] });
  });

  it("fails with whitespace-only name", () => {
    expect(
      validateRegister("   ", "Doe", "john@example.com", "password123!"),
    ).toEqual({ name: ["Name is required"] });
  });

  it("fails with empty lastname", () => {
    expect(
      validateRegister("John", "", "john@example.com", "password123!"),
    ).toEqual({ lastname: ["Last name is required"] });
  });

  it("fails with whitespace-only lastname", () => {
    expect(
      validateRegister("John", "   ", "john@example.com", "password123!"),
    ).toEqual({ lastname: ["Last name is required"] });
  });

  it("fails with empty email", () => {
    expect(
      validateRegister("John", "Doe", "", "password123!"),
    ).toEqual({ email: ["Email is required"] });
  });

  it("fails with bad email format", () => {
    expect(
      validateRegister("John", "Doe", "not-an-email", "password123!"),
    ).toEqual({ email: ["Email format is invalid"] });
  });

  // --- Password boundary: 7 chars (fail) ---
  it("fails with 7-char password (below minimum)", () => {
    expect(
      validateRegister("John", "Doe", "john@example.com", "pass12!"),
    ).toEqual({
      password: ["Password must be between 8 and 72 characters"],
    });
  });

  // --- Password boundary: 8 chars (pass) ---
  it("passes with 8-char password (minimum boundary)", () => {
    expect(
      validateRegister("John", "Doe", "john@example.com", "pass123!"),
    ).toEqual({});
  });

  // --- Password boundary: 72 chars (pass) ---
  it("passes with 72-char password (maximum boundary)", () => {
    const pw72 = "a".repeat(72);
    // 72 'a' chars — no number or special char, but length check only
    // The length validator only checks 8-72, not complexity
    expect(
      validateRegister("John", "Doe", "john@example.com", pw72),
    ).toEqual({});
  });

  // --- Password boundary: 73 chars (fail) ---
  it("fails with 73-char password (above maximum)", () => {
    const pw73 = "a".repeat(73);
    expect(
      validateRegister("John", "Doe", "john@example.com", pw73),
    ).toEqual({
      password: ["Password must be between 8 and 72 characters"],
    });
  });

  // --- Password required ---
  it("fails with empty password", () => {
    expect(
      validateRegister("John", "Doe", "john@example.com", ""),
    ).toEqual({ password: ["Password is required"] });
  });
});
