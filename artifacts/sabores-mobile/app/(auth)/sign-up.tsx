import { useOAuth, useSignUp } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EyeIcon } from "@/components/EyeIcon";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

type Stage = "form" | "verify";

export default function SignUpScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { signUp } = useSignUp();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 200,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={12}
            testID="sign-up-close"
          >
            <Text style={[styles.closeIcon, { color: colors.foreground }]}>✕</Text>
          </Pressable>
        </View>

        {stage === "form" ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.flag}>🇭🇳</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t.signUpTitle ?? "Create your account"}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {t.signUpSub ?? "Save your address, track orders and pay faster."}
              </Text>
            </View>

            <View style={styles.form}>
              <Pressable
                testID="oauth-google"
                onPress={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                style={({ pressed }) => [
                  styles.oauthBtn,
                  { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 },
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

              <Text style={[styles.label, { color: colors.foreground }]}>{t.email ?? "Email"}</Text>
              <TextInput
                testID="email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                style={[
                  styles.input,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>{t.password ?? "Password"}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  testID="password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  blurOnSubmit={false}
                  style={[styles.inputInner, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  testID="toggle-password-visibility"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon size={22} color={colors.mutedForeground} off={showPassword} />
                </Pressable>
              </View>
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                {t.signUpHelper ?? "At least 8 characters."}
              </Text>

              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.confirmPassword ?? "Confirm password"}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <TextInput
                  ref={confirmRef}
                  testID="confirm-password-input"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleStart}
                  style={[styles.inputInner, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  testID="toggle-confirm-visibility"
                  accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon size={22} color={colors.mutedForeground} off={showConfirm} />
                </Pressable>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]} testID="error-message">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-sign-up"
                onPress={handleStart}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: submitting || pressed ? 0.85 : 1 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    {t.signUpButton ?? "Create Account"}
                  </Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  {t.alreadyHaveAccount ?? "Already have an account?"}{" "}
                </Text>
                <Link href="/(auth)/sign-in" replace asChild>
                  <Pressable testID="link-sign-in">
                    <Text style={[styles.linkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {t.signInLink ?? "Sign in"}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.flag}>📬</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t.verifyTitle ?? "Check your email"}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {(t.verifySub ?? "We sent a 6-digit code to ") + email}
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.verifyCodeLabel ?? "Verification code"}
              </Text>
              <TextInput
                testID="code-input"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                returnKeyType="go"
                onSubmitEditing={handleVerify}
                style={[
                  styles.input,
                  styles.codeInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]} testID="error-message">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-verify"
                onPress={handleVerify}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: submitting || pressed ? 0.85 : 1 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    {t.verifyButton ?? "Verify & Continue"}
                  </Text>
                )}
              </Pressable>

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
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { fontSize: 22, fontFamily: "Inter_500Medium" },
  hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, alignItems: "center" },
  flag: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  form: { paddingHorizontal: 24, gap: 14 },
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleG: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#4285F4" },
  appleLogo: { fontSize: 20, fontFamily: "Inter_500Medium", marginTop: -2 },
  oauthLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 6 },
  dividerLine: { height: 1, flex: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 4 },
  helperText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -8 },
  linkText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 8,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
  },
  eyeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  backLinkRow: { alignItems: "center", marginTop: 12 },
});
