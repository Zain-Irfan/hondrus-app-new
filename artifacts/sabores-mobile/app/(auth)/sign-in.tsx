import { useOAuth, useSignIn } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthUnavailable } from "@/components/AuthUnavailable";
import { EyeIcon } from "@/components/EyeIcon";
import { AuthShell, Button, ErrorBanner, TextField } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

const hasClerk = !!(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");

export default function SignInScreen() {
  if (!hasClerk) return <AuthUnavailable />;
  return <SignInContent />;
}

function SignInContent() {
  const colors = useColors();
  const { t } = useLanguage();
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
    <AuthShell
      title={t.signInTitle ?? "Welcome back"}
      subtitle={t.signInSub ?? "Sign in to continue with your orders"}
    >
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
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
        containerStyle={{ marginBottom: 8 }}
      />

      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.v2.text.secondary }]}>{t.password ?? "Password"}</Text>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable testID="link-forgot-password">
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t.forgotPasswordLink ?? "Forgot?"}
            </Text>
          </Pressable>
        </Link>
      </View>
      <TextField
        testID="password-input"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!showPassword}
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        containerStyle={{ marginBottom: 8 }}
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

      {error ? <ErrorBanner message={error} /> : null}

      <Button
        testID="submit-sign-in"
        title={t.signInButton ?? "Sign In"}
        onPress={handleSubmit}
        loading={submitting}
      />

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          {t.noAccountYet ?? "No account yet?"}{" "}
        </Text>
        <Link href="/(auth)/sign-up" replace asChild>
          <Pressable testID="link-sign-up">
            <Text style={[styles.linkText, { color: colors.primary, fontFamily: fonts.semibold }]}>
              {t.signUpLink ?? "Create one"}
            </Text>
          </Pressable>
        </Link>
      </View>
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
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  label: { fontSize: 13, fontFamily: fonts.semibold, marginBottom: 6, marginTop: 4 },
  linkText: { fontSize: 13, fontFamily: fonts.medium },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
  },
  eyeBtnText: { fontSize: 14, fontFamily: fonts.semibold },
  errorText: { fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 16, fontFamily: fonts.bold },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  footerText: { fontSize: 14, fontFamily: fonts.regular },
});
