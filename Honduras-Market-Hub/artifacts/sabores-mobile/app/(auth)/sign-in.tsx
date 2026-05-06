import { useOAuth, useSignIn } from "@clerk/expo";
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

export default function SignInScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError(t.invalidEmailMsg ?? "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError(t.passwordRequired ?? "Please enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      console.log("[SignIn] calling signIn.password for", trimmedEmail);
      const { error: passwordError } = await signIn.password({
        identifier: trimmedEmail,
        password,
      });
      console.log("[SignIn] after password — status:", signIn.status, "error:", passwordError?.code, passwordError?.message);
      if (passwordError) {
        setError(
          passwordError.longMessage ??
            passwordError.message ??
            (t.loginErrorMsg ?? "Could not sign in. Please try again."),
        );
        return;
      }
      if (signIn.status === "complete") {
        console.log("[SignIn] complete, calling finalize");
        const { error: finalizeError } = await signIn.finalize();
        console.log("[SignIn] after finalize — error:", finalizeError?.code, finalizeError?.message);
        if (finalizeError) {
          setError(
            finalizeError.longMessage ??
              finalizeError.message ??
              (t.signInIncomplete ?? "Could not complete sign in."),
          );
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/cuenta");
      } else {
        console.log("[SignIn] not complete — status was:", signIn.status);
        setError(`Sign-in status: ${signIn.status}. ${t.signInIncomplete ?? "Could not complete sign in. Try again."}`);
      }
    } catch (err: any) {
      console.log("[SignIn] threw:", err?.errors, err?.message);
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message;
      setError(msg ?? (t.loginErrorMsg ?? "Could not sign in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }, [signIn, email, password, t]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      setError(null);
      setOauthLoading(provider);
      try {
        const flow = provider === "google" ? googleOAuth : appleOAuth;
        const result: any = await flow();
        console.log("[OAuth] result:", JSON.stringify({
          provider,
          createdSessionId: result?.createdSessionId,
          signInStatus: result?.signIn?.status,
          signUpStatus: result?.signUp?.status,
          authSessionResult: result?.authSessionResult?.type,
        }));

        const { createdSessionId, setActive: oauthSetActive, signIn: oauthSignIn, signUp: oauthSignUp, authSessionResult } = result;

        // User cancelled the browser flow
        if (authSessionResult?.type === "cancel" || authSessionResult?.type === "dismiss") {
          return;
        }

        if (createdSessionId && oauthSetActive) {
          await oauthSetActive({ session: createdSessionId });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)/cuenta");
          return;
        }

        // Existing user with same email — Clerk may need a transfer flow
        if (oauthSignIn?.firstFactorVerification?.status === "transferable" && signIn) {
          const transferResult: any = await signIn.create({ transfer: true } as any);
          if (transferResult?.createdSessionId && oauthSetActive) {
            await oauthSetActive({ session: transferResult.createdSessionId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(tabs)/cuenta");
            return;
          }
        }

        // Sign-up flow needs more info
        if (oauthSignUp?.missingFields?.length > 0) {
          setError(`Sign-in needs more info: ${oauthSignUp.missingFields.join(", ")}. Please use email + password to sign in.`);
          return;
        }

        // Fallback: nothing actionable
        setError(
          `Sign-in did not complete (signIn: ${oauthSignIn?.status ?? "n/a"}, signUp: ${oauthSignUp?.status ?? "n/a"}). Please try again or use email + password.`,
        );
      } catch (err: any) {
        console.log("[OAuth] error:", err?.message, err?.errors);
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
    [googleOAuth, appleOAuth, signIn, t],
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
            testID="sign-in-close"
          >
            <Text style={[styles.closeIcon, { color: colors.foreground }]}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.flag}>🇭🇳</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.signInTitle ?? "Welcome back"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {t.signInSub ?? "Sign in to continue with your orders"}
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

          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.foreground }]}>{t.password ?? "Password"}</Text>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable testID="link-forgot-password">
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t.forgotPasswordLink ?? "Forgot?"}
                </Text>
              </Pressable>
            </Link>
          </View>
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
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
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

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]} testID="error-message">
              {error}
            </Text>
          ) : null}

          <Pressable
            testID="submit-sign-in"
            onPress={handleSubmit}
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
                {t.signInButton ?? "Sign In"}
              </Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t.noAccountYet ?? "No account yet?"}{" "}
            </Text>
            <Link href="/(auth)/sign-up" replace asChild>
              <Pressable testID="link-sign-up">
                <Text style={[styles.linkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {t.signUpLink ?? "Create one"}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
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
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 4 },
  linkText: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
});
