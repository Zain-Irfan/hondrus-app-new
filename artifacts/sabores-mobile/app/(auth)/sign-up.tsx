import { useOAuth, useSignUp } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AuthUnavailable } from "@/components/AuthUnavailable";
import { EyeIcon } from "@/components/EyeIcon";
import { AuthShell, Button, ErrorBanner, TextField } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

type Stage = "form" | "verify";

const hasClerk = !!(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");

export default function SignUpScreen() {
  if (!hasClerk) return <AuthUnavailable />;
  return <SignUpContent />;
}

function SignUpContent() {
  const colors = useColors();
  const { t } = useLanguage();
  const { signUp } = useSignUp();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return t.passwordTooShort ?? "Password must be at least 8 characters.";
    return null;
  };

  const friendlyClerkError = (err: any): string | null => {
    const code = (err?.errors?.[0]?.code ?? err?.code ?? "").toString().toLowerCase();
    const msg = (err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? "").toString().toLowerCase();
    if (code.includes("pwned") || msg.includes("data breach") || msg.includes("pwned") || msg.includes("compromised")) {
      return t.errorPasswordPwned ?? "That password is too common. Please pick a slightly different one.";
    }
    return null;
  };

  const handleStart = useCallback(async () => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError(t.invalidEmailMsg ?? "Please enter a valid email address.");
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch ?? "Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      console.log("[SignUp] calling signUp.password for", trimmedEmail);
      const { error: pwError } = await signUp.password({
        emailAddress: trimmedEmail,
        password,
      });
      console.log("[SignUp] after password — status:", signUp.status, "error:", pwError?.code, pwError?.message);
      if (pwError) {
        const friendly = friendlyClerkError(pwError);
        setError(
          friendly ??
            pwError.longMessage ??
            pwError.message ??
            (t.signUpErrorMsg ?? "Could not create your account."),
        );
        return;
      }
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      console.log("[SignUp] after sendEmailCode — error:", sendError?.code, sendError?.message);
      if (sendError) {
        setError(
          sendError.longMessage ??
            sendError.message ??
            (t.signUpErrorMsg ?? "Could not send the code."),
        );
        return;
      }
      setStage("verify");
    } catch (err: any) {
      console.log("[SignUp] start threw:", err?.errors, err?.message);
      const friendly = friendlyClerkError(err);
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message;
      setError(friendly ?? msg ?? (t.signUpErrorMsg ?? "Could not create your account."));
    } finally {
      setSubmitting(false);
    }
  }, [signUp, email, password, confirmPassword, t]);

  const handleVerify = useCallback(async () => {
    setError(null);
    if (!code || code.length < 4) {
      setError(t.codeRequired ?? "Enter the verification code.");
      return;
    }
    setSubmitting(true);
    try {
      console.log("[SignUp] verifying code");
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      console.log("[SignUp] after verify — status:", signUp.status, "error:", verifyError?.code, verifyError?.message);
      if (verifyError) {
        setError(
          verifyError.longMessage ??
            verifyError.message ??
            (t.codeInvalid ?? "Invalid verification code."),
        );
        return;
      }
      if (signUp.status === "complete") {
        console.log("[SignUp] complete, calling finalize");
        const { error: finalizeError } = await signUp.finalize();
        console.log("[SignUp] after finalize — error:", finalizeError?.code, finalizeError?.message);
        if (finalizeError) {
          setError(
            finalizeError.longMessage ??
              finalizeError.message ??
              (t.signUpIncomplete ?? "Could not complete sign up."),
          );
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/cuenta");
      } else {
        console.log("[SignUp] not complete — status was:", signUp.status, "missingFields:", signUp.missingFields);
        setError(`Sign-up status: ${signUp.status}. ${t.signUpIncomplete ?? "Could not complete sign up. Try again."}`);
      }
    } catch (err: any) {
      console.log("[SignUp] verify threw:", err?.errors, err?.message);
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message;
      setError(msg ?? (t.codeInvalid ?? "Invalid verification code."));
    } finally {
      setSubmitting(false);
    }
  }, [signUp, code, t]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      setError(null);
      setOauthLoading(provider);
      try {
        const flow = provider === "google" ? googleOAuth : appleOAuth;
        const { createdSessionId, setActive: oauthSetActive } = await flow();
        if (createdSessionId && oauthSetActive) {
          await oauthSetActive({ session: createdSessionId });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)/cuenta");
        }
      } catch (err: any) {
        const firstErr = err?.errors?.[0];
        const code = firstErr?.code ?? "";
        const rawMsg = firstErr?.longMessage ?? firstErr?.message ?? err?.message ?? "";
        const isRedirectMismatch =
          code === "resource_missmatch" ||
          code === "redirect_url_mismatch" ||
          /redirect url|redirect uri|authorized redirect/i.test(rawMsg);
        if (isRedirectMismatch) {
          setError(
            t.oauthDevUnavailableMsg ??
              "Google sign-in is not available in the development app. It will work in the published version of the app. Please use email and password for now.",
          );
        } else {
          setError(rawMsg || (t.oauthErrorMsg ?? "Could not connect. Please try again."));
        }
      } finally {
        setOauthLoading(null);
      }
    },
    [googleOAuth, appleOAuth, t],
  );

  return (
    <AuthShell
      title={
        stage === "form"
          ? (t.signUpTitle ?? "Create your account")
          : (t.verifyTitle ?? "Check your email")
      }
      subtitle={
        stage === "form"
          ? (t.signUpSub ?? "Save your address, track orders and pay faster.")
          : (t.verifySub ?? "We sent a 6-digit code to ") + email
      }
    >
      {stage === "form" ? (
        <>
          <Pressable
            testID="oauth-google"
            onPress={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            style={({ pressed }) => [
              styles.oauthBtn,
              { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {oauthLoading === "google" ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.oauthLabel, { color: colors.foreground }]}>
                  {t.continueWithGoogle ?? "Continue with Google"}
                </Text>
              </>
            )}
          </Pressable>

          {Platform.OS === "ios" && (
            <Pressable
              testID="oauth-apple"
              onPress={() => handleOAuth("apple")}
              disabled={oauthLoading !== null}
              style={({ pressed }) => [
                styles.oauthBtn,
                { borderColor: "#000", backgroundColor: "#000", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {oauthLoading === "apple" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={[styles.appleLogo, { color: "#fff" }]}></Text>
                  <Text style={[styles.oauthLabel, { color: "#fff" }]}>
                    {t.continueWithApple ?? "Continue with Apple"}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              {t.orContinueWith ?? "or"}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TextField
            testID="email-input"
            label={t.email ?? "Email"}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            containerStyle={{ marginBottom: 4 }}
          />

          <TextField
            testID="password-input"
            label={t.password ?? "Password"}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            helper={t.signUpHelper ?? "At least 8 characters."}
            containerStyle={{ marginBottom: 4 }}
            rightAccessory={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                testID="toggle-password-visibility"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon size={22} color={colors.mutedForeground} off={showPassword} />
              </Pressable>
            }
          />

          <TextField
            testID="confirm-password-input"
            label={t.confirmPassword ?? "Confirm password"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showConfirm}
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleStart}
            containerStyle={{ marginBottom: 4 }}
            rightAccessory={
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={8}
                testID="toggle-confirm-visibility"
                accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
              >
                <EyeIcon size={22} color={colors.mutedForeground} off={showConfirm} />
              </Pressable>
            }
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button
            testID="submit-sign-up"
            title={t.signUpButton ?? "Create Account"}
            onPress={handleStart}
            loading={submitting}
          />

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t.alreadyHaveAccount ?? "Already have an account?"}{" "}
            </Text>
            <Link href="/(auth)/sign-in" replace asChild>
              <Pressable testID="link-sign-in">
                <Text style={[styles.linkText, { color: colors.primary, fontFamily: fonts.semibold }]}>
                  {t.signInLink ?? "Sign in"}
                </Text>
              </Pressable>
            </Link>
          </View>
        </>
      ) : (
        <>
          <TextField
            testID="code-input"
            label={t.verifyCodeLabel ?? "Verification code"}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            returnKeyType="go"
            onSubmitEditing={handleVerify}
            style={styles.codeInput}
            containerStyle={{ marginBottom: 8 }}
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button
            testID="submit-verify"
            title={t.verifyButton ?? "Verify & Continue"}
            onPress={handleVerify}
            loading={submitting}
          />

          <Pressable
            onPress={() => {
              setStage("form");
              setCode("");
              setError(null);
            }}
            style={styles.backLinkRow}
          >
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              ← {t.changeEmail ?? "Use a different email"}
            </Text>
          </Pressable>
        </>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleG: { fontSize: 20, fontFamily: fonts.bold, color: "#4285F4" },
  appleLogo: { fontSize: 20, fontFamily: fonts.medium, marginTop: -2 },
  oauthLabel: { fontSize: 15, fontFamily: fonts.semibold },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 6 },
  dividerLine: { height: 1, flex: 1 },
  dividerText: { fontSize: 12, fontFamily: fonts.medium, textTransform: "uppercase", letterSpacing: 1 },
  linkText: { fontSize: 14, fontFamily: fonts.medium },
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontFamily: fonts.bold,
  },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  footerText: { fontSize: 14, fontFamily: fonts.regular },
  backLinkRow: { alignItems: "center", marginTop: 12 },
});
