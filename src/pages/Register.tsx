/**
 * Register page — real implementation replacing the placeholder.
 * Uses the API client and AuthProvider for form submission and session
 * resolution. Client-side validation mirrors backend rules (spec §6.3):
 * name/lastname required, email format, password 8–72 chars. Backend
 * field errors are surfaced per-field. On success the user is redirected
 * to the `next` query param or `/`.
 *
 * @spec (spec §4.5, §6.3, §23.2, §23.4)
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { type FieldErrors, ValidationError, NetworkError } from "../lib/api";
import { validateRegistration } from "../lib/validation";

/**
 * Register page component. Renders a form with name, lastname, email,
 * and password fields, client-side validation per §6.3, and per-field
 * error display from backend responses.
 * @spec (spec §4.5, §6.3, §23.2)
 */
export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next") ?? "";

  function clearErrors() {
    setFieldErrors({});
    setGeneralError("");
  }

  /**
   * Runs the shared §6.3 registration validation (src/lib/validation.ts)
   * against the current form values and surfaces the errors per field.
   * @spec (spec §6.3)
   */
  function validate(): boolean {
    const errors = validateRegistration({ name, lastname, email, password });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();

    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(name.trim(), lastname.trim(), email.trim(), password);
      const target = next ? decodeURIComponent(next) : "/";
      navigate(target, { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ValidationError) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof NetworkError) {
        setGeneralError("Network error — please check your connection");
      } else {
        setGeneralError("An unexpected error occurred");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Regístrate</h1>

        {generalError && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm"
          >
            {generalError}
          </div>
        )}

        <form
          data-auth-form
          data-auth-endpoint="/api/auth/register"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name)
                  setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full border rounded px-3 py-2 text-sm ${
                fieldErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="lastname"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last name
            </label>
            <input
              id="lastname"
              name="lastname"
              type="text"
              value={lastname}
              onChange={(e) => {
                setLastname(e.target.value);
                if (fieldErrors.lastname)
                  setFieldErrors((prev) => ({ ...prev, lastname: undefined }));
              }}
              className={`w-full border rounded px-3 py-2 text-sm ${
                fieldErrors.lastname ? "border-red-500" : "border-gray-300"
              }`}
              autoComplete="family-name"
            />
            {fieldErrors.lastname && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.lastname[0]}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full border rounded px-3 py-2 text-sm ${
                fieldErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`w-full border rounded px-3 py-2 text-sm ${
                fieldErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.password[0]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 text-white rounded py-2 px-4 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-teal-600 hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
