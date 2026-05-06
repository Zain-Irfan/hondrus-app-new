import { useState, FormEvent, useMemo, useEffect } from "react";
import { useSignUp } from "@clerk/react";
import { useLocation, Link } from "wouter";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function isObviouslyWeak(pw: string): boolean {
  if (/^(.)\1+$/.test(pw)) return true;
  return false;
}

async function sha1Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hashBuf = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkHibp(password: string, signal: AbortSignal): Promise<"pwned" | "safe" | "unknown"> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 4000);
  const combinedSignal = anySignal([signal, timeoutController.signal]);
  try {
    const hash = (await sha1Hex(password)).toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: combinedSignal,
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return "unknown";
    const text = await res.text();
    const found = text.split("\n").some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
    return found ? "pwned" : "safe";
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      if (signal.aborted) throw err;
      return "unknown";
    }
    return "unknown";
  } finally {
    clearTimeout(timeout);
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

interface ClerkErrorEntry {
  message?: string;
  longMessage?: string;
  code?: string;
}

interface ClerkErrorShape {
  errors?: ClerkErrorEntry[];
  message?: string;
  longMessage?: string;
  code?: string;
}

type AuthStrings = ReturnType<typeof useLanguage>["t"]["auth"];

function localizeClerkCode(code: string | undefined, t: AuthStrings): string | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (c.includes("pwned")) return t.errorPasswordPwned;
  if (c.includes("password") && (c.includes("short") || c.includes("min"))) return t.errorPasswordTooShort;
  if (c.includes("password") && (c.includes("weak") || c.includes("strength") || c.includes("complex"))) return t.errorPasswordTooWeak;
  if (c.includes("identifier_exists") || c.includes("email_address_exists") || c.includes("already_exists")) return t.errorIdentifierExists;
  if (c.includes("email") && (c.includes("invalid") || c.includes("format"))) return t.errorEmailInvalid;
  if (c.includes("code") && (c.includes("incorrect") || c.includes("invalid"))) return t.errorCodeIncorrect;
  if (c.includes("code") && c.includes("expired")) return t.errorCodeExpired;
  if (c.includes("verification") && (c.includes("expired") || c.includes("failed"))) return t.errorCodeIncorrect;
  if (c.includes("rate_limit") || c.includes("too_many")) return t.errorTooManyRequests;
  if (c.includes("captcha")) return t.errorCaptchaFailed;
  if (c.includes("network") || c.includes("connection")) return t.errorNetwork;
  return null;
}

function extractErrorMessage(err: unknown, fallback: string, t: AuthStrings): string {
  if (!err) return fallback;
  const e = err as ClerkErrorShape;
  const first = e?.errors?.[0];

  const localized = localizeClerkCode(first?.code ?? e?.code, t);
  if (localized) return localized;

  if (first?.longMessage) return first.longMessage;
  if (first?.message) return first.message;
  if (e?.longMessage) return e.longMessage;
  if (e?.message) return e.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function CustomSignUp() {
  const { signUp } = useSignUp();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  if (!signUp) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex items-center justify-center min-h-[420px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#002B7F]" />
      </div>
    );
  }

  const handleGoogle = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: ssoError } = await signUp.sso({
        strategy: "oauth_google",
        redirectUrl: `${basePath}/` || "/",
        redirectCallbackUrl: `${origin}${basePath}/sign-up/sso-callback`,
      });
      if (ssoError) {
        setOauthLoading(false);
        setError(extractErrorMessage(ssoError, t.auth.loginError, t.auth));
      }
    } catch (err) {
      setOauthLoading(false);
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    }
  };

  const passwordIssue = useMemo<string | null>(() => {
    if (password.length === 0) return null;
    if (password.length < 8) return t.auth.passwordTooShort;
    return null;
  }, [password, t.auth]);

  const passwordChecking = false;
  const passwordOk = password.length >= 8 && !passwordIssue;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit = !!email && passwordOk && confirmPassword === password && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (passwordIssue) {
      setError(passwordIssue);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    setSubmitting(true);
    try {
      const { error: pwError } = await signUp.password({
        emailAddress: email,
        password,
      });
      if (pwError) {
        setError(extractErrorMessage(pwError, t.auth.loginError, t.auth));
        setSubmitting(false);
        return;
      }

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setError(extractErrorMessage(finalizeError, t.auth.loginError, t.auth));
          setSubmitting(false);
          return;
        }
        setLocation("/");
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(extractErrorMessage(sendError, t.auth.loginError, t.auth));
        setSubmitting(false);
        return;
      }
      setStep("verify");
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(extractErrorMessage(verifyError, t.auth.loginError, t.auth));
        setVerifying(false);
        return;
      }

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setError(extractErrorMessage(finalizeError, t.auth.loginError, t.auth));
          setVerifying(false);
          return;
        }
        setLocation("/");
      } else {
        setError(t.auth.loginError);
      }
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResentMessage(null);
    setResending(true);
    try {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(extractErrorMessage(sendError, t.auth.loginError, t.auth));
      } else {
        setResentMessage(t.auth.codeResent);
      }
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setResending(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="Sabores de Honduras" className="h-12 w-auto" />
          </div>
          <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">{t.auth.verifyEmailTitle}</h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            {t.auth.verifyEmailDesc} <span className="font-semibold text-gray-900">{email}</span>
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-gray-700 font-semibold text-sm mb-1.5">
                {t.auth.verificationCodeLabel}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.auth.verificationCodePlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
                data-testid="input-verification-code"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm">{error}</div>
            )}
            {resentMessage && !error && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm">
                {resentMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || code.length < 6}
              className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
              data-testid="button-verify"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.auth.verifying}
                </>
              ) : (
                t.auth.verify
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setError(null);
                  setResentMessage(null);
                }}
                className="text-gray-600 hover:text-[#002B7F] font-medium"
                data-testid="button-back-to-signup"
              >
                ← {t.auth.backToSignUp}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#002B7F] hover:text-[#C9A84C] font-semibold disabled:opacity-50"
                data-testid="button-resend-code"
              >
                {t.auth.resendCode}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8 sm:p-10">
        <div className="flex justify-center mb-4">
          <img src={`${basePath}/logo.svg`} alt="Sabores de Honduras" className="h-12 w-auto" />
        </div>
        <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">{t.auth.createAccount}</h1>
        <p className="text-gray-600 text-center mb-6 text-sm">{t.auth.createAccountSubtitle}</p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="w-full border border-gray-200 hover:bg-gray-50 rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 text-gray-800 font-semibold transition-colors disabled:opacity-50 mb-5"
          data-testid="button-google-signup"
        >
          {oauthLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          {t.auth.continueWithGoogle}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-500 text-sm">{t.auth.orContinueWith}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold text-sm mb-1.5">
              {t.auth.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
              data-testid="input-email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold text-sm mb-1.5">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                aria-invalid={!!passwordIssue}
                aria-describedby="password-help"
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:outline-none ${
                  passwordIssue
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : passwordOk
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
                      : "border-gray-300 focus:border-[#002B7F] focus:ring-[#002B7F]/20"
                }`}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordIssue ? (
              <p
                id="password-help"
                className="text-rose-600 text-xs mt-1.5 flex items-start gap-1"
                data-testid="text-password-issue"
              >
                <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{passwordIssue}</span>
              </p>
            ) : passwordChecking ? (
              <p
                id="password-help"
                className="text-gray-500 text-xs mt-1.5 flex items-center gap-1"
                data-testid="text-password-checking"
              >
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                <span>{t.auth.passwordChecking}</span>
              </p>
            ) : passwordOk ? (
              <p
                id="password-help"
                className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1"
                data-testid="text-password-ok"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.passwordLooksGood}</span>
              </p>
            ) : (
              <p id="password-help" className="text-gray-500 text-xs mt-1.5">
                {t.auth.passwordRequirements}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold text-sm mb-1.5">
              {t.auth.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.auth.confirmPasswordPlaceholder}
                aria-invalid={confirmMismatch}
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:outline-none ${
                  confirmMismatch
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-gray-300 focus:border-[#002B7F] focus:ring-[#002B7F]/20"
                }`}
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? t.auth.hidePassword : t.auth.showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmMismatch && (
              <p className="text-rose-600 text-xs mt-1.5 flex items-start gap-1">
                <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{t.auth.passwordsDoNotMatch}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm" data-testid="text-form-error">
              {error}
            </div>
          )}

          <div
            id="clerk-captcha"
            className="empty:hidden"
            data-cl-theme="light"
            data-cl-size="flexible"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            data-testid="button-submit-signup"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.auth.creatingAccount}
              </>
            ) : (
              t.auth.continue
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          {t.auth.alreadyHaveAccount}{" "}
          <Link href="/sign-in" className="text-[#002B7F] font-semibold hover:text-[#C9A84C]">
            {t.auth.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
