import { useEffect, useState, FormEvent, useMemo } from "react";
import { useSignIn, useClerk, useAuth } from "@clerk/react";
import { useLocation, Link } from "wouter";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "p@ssw0rd",
  "12345678", "123456789", "1234567890", "11111111", "00000000",
  "qwerty", "qwerty123", "qwertyuiop", "qwer1234", "qazwsx", "qazwsxedc",
  "asdfghjk", "asdfghjkl", "asdfasdf", "asdf1234",
  "zxcvbnm", "zxcvbnm1", "1q2w3e4r", "1qaz2wsx", "zaq12wsx",
  "abc12345", "abcd1234", "abcdef12", "abcdefgh",
  "letmein", "letmein1", "welcome", "welcome1", "iloveyou",
  "admin", "admin123", "administrator",
  "monkey", "dragon", "master", "shadow", "superman", "batman",
  "hello123", "test1234", "testtest", "trustno1",
  "sunshine", "princess", "football", "baseball", "starwars",
  "freedom", "whatever", "computer", "internet", "cheese",
  "aaaaaaaa", "11223344", "12341234", "qwertyui", "1234abcd",
  "honduras", "sabores", "saboresdehonduras",
]);

function isPwnedLike(pw: string): boolean {
  const lower = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  if (/^(.)\1{5,}$/.test(pw)) return true;
  if (/^(?:0123|1234|2345|3456|4567|5678|6789|7890|abcd|qwer|asdf|zxcv)/i.test(pw) && pw.length <= 12) return true;
  return false;
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
  if (c.includes("password") && (c.includes("incorrect") || c.includes("invalid"))) return t.errorInvalidCredentials;
  if (c.includes("identifier") && c.includes("not_found")) return t.errorAccountNotFound;
  if (c.includes("form_password_incorrect")) return t.errorInvalidCredentials;
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

type SignInResetGroup = {
  sendCode: (params?: unknown) => Promise<{ error: unknown }>;
  verifyCode: (params: { code: string }) => Promise<{ error: unknown }>;
  submitPassword: (params: { password: string }) => Promise<{ error: unknown }>;
};

export function CustomSignIn() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, setLocation]);

  const [step, setStep] = useState<"form" | "reset-request" | "reset-verify" | "sf-verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sfCode, setSfCode] = useState("");
  const [sfStrategy, setSfStrategy] = useState<string | null>(null);
  const [sfMaskedIdentifier, setSfMaskedIdentifier] = useState<string | null>(null);

  if (!signIn) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex items-center justify-center min-h-[420px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#002B7F]" />
      </div>
    );
  }

  const newPasswordIssue = useMemo<string | null>(() => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 8) return t.auth.passwordTooShort;
    if (isPwnedLike(newPassword)) return t.auth.errorPasswordPwned;
    const emailUser = (resetEmail || email).split("@")[0]?.toLowerCase() ?? "";
    if (emailUser.length >= 4 && newPassword.toLowerCase().includes(emailUser)) {
      return t.auth.errorPasswordTooWeak;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return t.auth.errorPasswordTooWeak;
    }
    return null;
  }, [newPassword, resetEmail, email, t.auth]);

  const newPasswordOk = newPassword.length >= 8 && newPasswordIssue === null;
  const canSignIn = !!email && password.length >= 1 && !submitting;
  const canSendResetCode = !!resetEmail && !submitting;
  const canSubmitNewPassword = resetCode.length === 6 && newPasswordOk && !submitting;

  const clerk = useClerk();

  const handleGoogle = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const ogSignIn = (clerk as unknown as {
        client?: {
          signIn?: {
            authenticateWithRedirect?: (params: {
              strategy: string;
              redirectUrl: string;
              redirectUrlComplete: string;
            }) => Promise<void>;
          };
        };
      }).client?.signIn;

      // eslint-disable-next-line no-console
      console.log("[google] handler start", {
        hasOgSignIn: !!ogSignIn,
        hasAuthenticateWithRedirect: !!ogSignIn?.authenticateWithRedirect,
      });

      if (ogSignIn?.authenticateWithRedirect) {
        await ogSignIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${origin}${basePath}/sign-in/sso-callback`,
          redirectUrlComplete: `${basePath}/` || "/",
        });
        return; // browser will navigate away
      }

      // Fallback to future API
      const { error: ssoError } = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: `${basePath}/` || "/",
        redirectCallbackUrl: `${origin}${basePath}/sign-in/sso-callback`,
      });
      if (ssoError) {
        setOauthLoading(false);
        setError(extractErrorMessage(ssoError, t.auth.loginError, t.auth));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[google] handler threw", err);
      setOauthLoading(false);
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // Mobile uses signIn.password() and gets status="complete" because RN
      // is exempt from web-only "device verification". On web (browser) Clerk
      // returns status="needs_second_factor" for new browsers — we then send
      // an email/phone code and complete sign-in via attemptSecondFactor.
      const liveSignIn = signIn as unknown as {
        status: string | null;
        createdSessionId: string | null;
        supportedSecondFactors?: Array<{
          strategy?: string;
          emailAddressId?: string;
          phoneNumberId?: string;
          safeIdentifier?: string;
        }> | null;
        firstFactorVerification?: {
          status?: string;
          error?: { message?: string; longMessage?: string; code?: string } | null;
        } | null;
      };

      const { error: pwError } = await signIn.password({
        identifier: email,
        password,
      });
      // eslint-disable-next-line no-console
      console.log("[sign-in] after password()", {
        status: liveSignIn.status,
        createdSessionId: liveSignIn.createdSessionId,
        supportedSecondFactors: liveSignIn.supportedSecondFactors,
        firstFactorVerification: liveSignIn.firstFactorVerification,
        pwError,
      });

      if (pwError) {
        setError(extractErrorMessage(pwError, t.auth.errorInvalidCredentials, t.auth));
        return;
      }

      if (liveSignIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        // eslint-disable-next-line no-console
        console.log("[sign-in] after finalize()", { finalizeError });
        if (finalizeError) {
          if (liveSignIn.createdSessionId) {
            try {
              await setActive({ session: liveSignIn.createdSessionId });
              setLocation("/");
              return;
            } catch (activateErr) {
              // eslint-disable-next-line no-console
              console.warn("[sign-in] setActive fallback failed", activateErr);
            }
          }
          setError(extractErrorMessage(finalizeError, t.auth.loginError, t.auth));
          return;
        }
        setLocation("/");
        return;
      }

      // status === "needs_second_factor" — pick an available second factor
      // and send the verification code, then switch to the code-input step.
      if (liveSignIn.status === "needs_second_factor") {
        const factors = liveSignIn.supportedSecondFactors ?? [];
        const pick =
          factors.find((f) => f.strategy === "email_code") ||
          factors.find((f) => f.strategy === "phone_code") ||
          factors.find((f) => f.strategy === "totp") ||
          factors[0];

        if (!pick?.strategy) {
          setError(t.auth.errorSecondFactorUnavailable);
          return;
        }

        if (pick.strategy === "totp") {
          // TOTP doesn't need to "send" — user reads code from their app.
          setSfStrategy("totp");
          setSfMaskedIdentifier(null);
          setSfCode("");
          setStep("sf-verify");
          return;
        }

        const ogSignIn = (clerk as unknown as {
          client?: {
            signIn?: {
              prepareSecondFactor?: (params: {
                strategy: string;
                emailAddressId?: string;
                phoneNumberId?: string;
              }) => Promise<unknown>;
            };
          };
        }).client?.signIn;

        if (!ogSignIn?.prepareSecondFactor) {
          setError(t.auth.errorSecondFactorUnavailable);
          return;
        }

        try {
          await ogSignIn.prepareSecondFactor({
            strategy: pick.strategy,
            emailAddressId: pick.emailAddressId,
            phoneNumberId: pick.phoneNumberId,
          });
          // eslint-disable-next-line no-console
          console.log("[sign-in] prepareSecondFactor sent", {
            strategy: pick.strategy,
            safeIdentifier: pick.safeIdentifier,
          });
          setSfStrategy(pick.strategy);
          setSfMaskedIdentifier(pick.safeIdentifier ?? null);
          setSfCode("");
          setStep("sf-verify");
          return;
        } catch (prepErr) {
          setError(extractErrorMessage(prepErr, t.auth.errorSecondFactorSendFailed, t.auth));
          return;
        }
      }

      // Other unexpected status
      const verErr = liveSignIn.firstFactorVerification?.error;
      if (verErr?.longMessage || verErr?.message) {
        setError(verErr.longMessage || verErr.message || t.auth.errorInvalidCredentials);
        return;
      }
      setError(`${t.auth.loginError} (status: ${liveSignIn.status ?? "unknown"})`);
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySecondFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!sfStrategy) {
      setError(t.auth.errorSecondFactorUnavailable);
      return;
    }
    if (sfCode.length < 6) {
      setError(t.auth.errorCodeIncorrect);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const liveSignIn = signIn as unknown as {
        status: string | null;
        createdSessionId: string | null;
      };
      const ogSignIn = (clerk as unknown as {
        client?: {
          signIn?: {
            attemptSecondFactor?: (params: {
              strategy: string;
              code: string;
            }) => Promise<{
              status?: string | null;
              createdSessionId?: string | null;
            }>;
          };
        };
      }).client?.signIn;

      if (!ogSignIn?.attemptSecondFactor) {
        setError(t.auth.errorSecondFactorUnavailable);
        return;
      }

      const attempt = await ogSignIn.attemptSecondFactor({
        strategy: sfStrategy,
        code: sfCode,
      });
      // eslint-disable-next-line no-console
      console.log("[sign-in] attemptSecondFactor", {
        status: attempt?.status,
        createdSessionId: attempt?.createdSessionId,
        liveStatus: liveSignIn.status,
      });

      const completedSessionId = attempt?.createdSessionId ?? liveSignIn.createdSessionId;
      if ((attempt?.status === "complete" || liveSignIn.status === "complete") && completedSessionId) {
        await setActive({ session: completedSessionId });
        setLocation("/");
        return;
      }

      // Try Future API finalize as fallback
      if (liveSignIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (!finalizeError) {
          setLocation("/");
          return;
        }
      }
      setError(t.auth.errorCodeIncorrect);
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.errorCodeIncorrect, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendSecondFactor = async () => {
    if (submitting || !sfStrategy || sfStrategy === "totp") return;
    setError(null);
    setSubmitting(true);
    try {
      const factors =
        ((signIn as unknown as {
          supportedSecondFactors?: Array<{
            strategy?: string;
            emailAddressId?: string;
            phoneNumberId?: string;
          }> | null;
        }).supportedSecondFactors) ?? [];
      const pick = factors.find((f) => f.strategy === sfStrategy);
      const ogSignIn = (clerk as unknown as {
        client?: {
          signIn?: {
            prepareSecondFactor?: (params: {
              strategy: string;
              emailAddressId?: string;
              phoneNumberId?: string;
            }) => Promise<unknown>;
          };
        };
      }).client?.signIn;
      if (!ogSignIn?.prepareSecondFactor) {
        setError(t.auth.errorSecondFactorUnavailable);
        return;
      }
      await ogSignIn.prepareSecondFactor({
        strategy: sfStrategy,
        emailAddressId: pick?.emailAddressId,
        phoneNumberId: pick?.phoneNumberId,
      });
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.errorSecondFactorSendFailed, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetCode = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: createError } = await signIn.create({ identifier: resetEmail });
      if (createError) {
        setError(extractErrorMessage(createError, t.auth.loginError, t.auth));
        setSubmitting(false);
        return;
      }
      const reset = (signIn as unknown as { resetPasswordEmailCode: SignInResetGroup })
        .resetPasswordEmailCode;
      const { error: sendError } = await reset.sendCode();
      if (sendError) {
        setError(extractErrorMessage(sendError, t.auth.loginError, t.auth));
        setSubmitting(false);
        return;
      }
      setStep("reset-verify");
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (newPasswordIssue) {
      setError(newPasswordIssue);
      return;
    }
    setSubmitting(true);
    try {
      const reset = (signIn as unknown as { resetPasswordEmailCode: SignInResetGroup })
        .resetPasswordEmailCode;
      const { error: verifyError } = await reset.verifyCode({ code: resetCode });
      if (verifyError) {
        setError(extractErrorMessage(verifyError, t.auth.errorCodeIncorrect, t.auth));
        setSubmitting(false);
        return;
      }
      const { error: setPwError } = await reset.submitPassword({ password: newPassword });
      if (setPwError) {
        setError(extractErrorMessage(setPwError, t.auth.loginError, t.auth));
        setSubmitting(false);
        return;
      }
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(extractErrorMessage(finalizeError, t.auth.loginError, t.auth));
          setSubmitting(false);
          return;
        }
        setLocation("/");
        return;
      }
      setError(t.auth.loginError);
    } catch (err) {
      setError(extractErrorMessage(err, t.auth.loginError, t.auth));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "sf-verify") {
    const desc =
      sfStrategy === "phone_code"
        ? t.auth.verifyDevicePhoneDesc
        : sfStrategy === "totp"
          ? t.auth.verifyDeviceTotpDesc
          : t.auth.verifyDeviceEmailDesc;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="Sabores de Honduras" className="h-12 w-auto" />
          </div>
          <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">
            {t.auth.verifyDeviceTitle}
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            {desc}
            {sfMaskedIdentifier ? (
              <>
                {" "}
                <span className="font-semibold text-gray-900">{sfMaskedIdentifier}</span>
              </>
            ) : null}
          </p>

          <form onSubmit={handleVerifySecondFactor} className="space-y-4">
            <div>
              <label htmlFor="sf-code" className="block text-gray-700 font-semibold text-sm mb-1.5">
                {t.auth.verificationCodeLabel}
              </label>
              <input
                id="sf-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={sfCode}
                onChange={(e) => setSfCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.auth.verificationCodePlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
                data-testid="input-sf-code"
              />
            </div>

            {error && (
              <div
                className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm"
                data-testid="text-sf-error"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || sfCode.length < 6}
              className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
              data-testid="button-verify-sf"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.auth.verifyingDevice}
                </>
              ) : (
                t.auth.verifyDeviceButton
              )}
            </button>

            {sfStrategy && sfStrategy !== "totp" ? (
              <button
                type="button"
                onClick={handleResendSecondFactor}
                disabled={submitting}
                className="w-full text-[#002B7F] hover:text-[#001f5f] text-sm font-semibold pt-1 disabled:opacity-50"
                data-testid="button-resend-sf-code"
              >
                {t.auth.resendCode}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setSfCode("");
                setSfStrategy(null);
                setSfMaskedIdentifier(null);
                setError(null);
              }}
              className="w-full text-gray-600 hover:text-[#002B7F] text-sm font-medium pt-1"
              data-testid="button-back-to-signin-from-sf"
            >
              ← {t.auth.backToSignIn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "reset-request") {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="Sabores de Honduras" className="h-12 w-auto" />
          </div>
          <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">
            {t.auth.resetPasswordTitle}
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">{t.auth.resetPasswordDesc}</p>

          <form onSubmit={handleSendResetCode} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-gray-700 font-semibold text-sm mb-1.5">
                {t.auth.emailLabel}
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
                data-testid="input-reset-email"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSendResetCode}
              className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
              data-testid="button-send-reset-code"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.auth.sendingResetCode}
                </>
              ) : (
                t.auth.sendResetCode
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="w-full text-gray-600 hover:text-[#002B7F] text-sm font-medium pt-1"
              data-testid="button-back-to-signin-from-reset"
            >
              ← {t.auth.backToSignIn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "reset-verify") {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="Sabores de Honduras" className="h-12 w-auto" />
          </div>
          <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">
            {t.auth.resetPasswordVerifyTitle}
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            {t.auth.resetPasswordVerifyDesc}{" "}
            <span className="font-semibold text-gray-900">{resetEmail}</span>
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-code" className="block text-gray-700 font-semibold text-sm mb-1.5">
                {t.auth.verificationCodeLabel}
              </label>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.auth.verificationCodePlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
                data-testid="input-reset-code"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-gray-700 font-semibold text-sm mb-1.5">
                {t.auth.newPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.auth.newPasswordPlaceholder}
                  aria-invalid={!!newPasswordIssue}
                  className={`w-full border rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:outline-none ${
                    newPasswordIssue
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                      : newPasswordOk
                        ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
                        : "border-gray-300 focus:border-[#002B7F] focus:ring-[#002B7F]/20"
                  }`}
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((s) => !s)}
                  aria-label={showNewPassword ? t.auth.hidePassword : t.auth.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPasswordIssue ? (
                <p className="text-rose-600 text-xs mt-1.5 flex items-start gap-1">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{newPasswordIssue}</span>
                </p>
              ) : newPasswordOk ? (
                <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.auth.passwordLooksGood}</span>
                </p>
              ) : (
                <p className="text-gray-500 text-xs mt-1.5">{t.auth.passwordRequirements}</p>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmitNewPassword}
              className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
              data-testid="button-reset-password"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.auth.resettingPassword}
                </>
              ) : (
                t.auth.resetPasswordButton
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setResetCode("");
                setNewPassword("");
                setError(null);
              }}
              className="w-full text-gray-600 hover:text-[#002B7F] text-sm font-medium pt-1"
              data-testid="button-back-to-signin-from-verify"
            >
              ← {t.auth.backToSignIn}
            </button>
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
        <h1 className="text-[#002B7F] font-serif text-2xl font-bold text-center mb-2">
          {t.auth.welcomeBackTitle}
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm">{t.auth.welcomeBackSubtitle}</p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="w-full border border-gray-200 hover:bg-gray-50 rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 text-gray-800 font-semibold transition-colors disabled:opacity-50 mb-5"
          data-testid="button-google-signin"
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
            <label htmlFor="signin-email" className="block text-gray-700 font-semibold text-sm mb-1.5">
              {t.auth.emailLabel}
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
              data-testid="input-signin-email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="signin-password" className="block text-gray-700 font-semibold text-sm">
                {t.auth.passwordLabel}
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep("reset-request");
                  setResetEmail(email);
                  setError(null);
                }}
                className="text-[#002B7F] hover:text-[#C9A84C] text-xs font-semibold"
                data-testid="link-forgot-password"
              >
                {t.auth.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.signInPasswordPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:border-[#002B7F] focus:ring-2 focus:ring-[#002B7F]/20 focus:outline-none"
                data-testid="input-signin-password"
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
          </div>

          {error && (
            <div
              className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm"
              data-testid="text-signin-error"
            >
              {error}
            </div>
          )}

          <div id="clerk-captcha" />

          <button
            type="submit"
            disabled={!canSignIn}
            className="w-full bg-[#002B7F] hover:bg-[#001f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            data-testid="button-submit-signin"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.auth.signingIn}
              </>
            ) : (
              t.auth.signIn
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          {t.auth.dontHaveAccount}{" "}
          <Link href="/sign-up" className="text-[#002B7F] font-semibold hover:text-[#C9A84C]">
            {t.auth.signUpCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
