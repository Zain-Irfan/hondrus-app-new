import { useSignIn } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
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

type Step = "email" | "reset";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendCode = useCallback(async () => {
    setError(null);
    setInfo(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError(t.invalidEmailMsg ?? "Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: createError } = await signIn.create({
        identifier: trimmedEmail,
      });
      if (createError) {
        setError(
          createError.longMessage ??
            createError.message ??
            (t.resetSendError ?? "Could not send reset code."),
        );
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(
          sendError.longMessage ??
            sendError.message ??
            (t.resetSendError ?? "Could not send reset code."),
        );
        return;
      }
      setStep("reset");
      setInfo(t.resetCodeSent ?? "We sent a code to your email.");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message;
      setError(msg ?? (t.resetSendError ?? "Could not send reset code."));
    } finally {
      setSubmitting(false);
    }
  }, [signIn, email, t]);

  const submitReset = useCallback(async () => {
    setError(null);
    if (!code || code.length < 4) {
      setError(t.codeRequired ?? "Enter the verification code.");
      return;
    }
    if (newPassword.length < 8) {
      setError(t.passwordTooShort ?? "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch ?? "Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (verifyError) {
        setError(
          verifyError.longMessage ??
            verifyError.message ??
            (t.codeInvalid ?? "Invalid verification code."),
        );
        return;
      }
      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });
      if (submitError) {
        setError(
          submitError.longMessage ??
            submitError.message ??
            (t.resetError ?? "Could not reset password."),
        );
        return;
      }
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(
            finalizeError.longMessage ??
              finalizeError.message ??
              (t.resetIncomplete ?? "Could not complete password reset."),
          );
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/cuenta");
      } else {
        setError(t.resetIncomplete ?? "Could not complete password reset.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message;
      setError(msg ?? (t.resetError ?? "Could not reset password."));
    } finally {
      setSubmitting(false);
    }
  }, [signIn, code, newPassword, t]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={12}
            testID="forgot-close"
          >
            <Text style={[styles.closeIcon, { color: colors.foreground }]}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.flag}>🔐</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.resetTitle ?? "Reset your password"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {step === "email"
              ? t.resetSubEmail ?? "Enter your email and we'll send you a code."
              : (t.resetSubCode ?? "Enter the code we sent to ") + email}
          </Text>
        </View>

        <View style={styles.form}>
          {step === "email" ? (
            <>
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
                returnKeyType="go"
                onSubmitEditing={sendCode}
                style={[
                  styles.input,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]} testID="error-message">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-send-code"
                onPress={sendCode}
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
                    {t.sendResetCode ?? "Send Reset Code"}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {info ? (
                <Text style={[styles.infoText, { color: colors.success }]}>{info}</Text>
              ) : null}

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
                style={[
                  styles.input,
                  styles.codeInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>
                {t.newPassword ?? "New password"}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <TextInput
                  testID="new-password-input"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showNewPassword}
                  textContentType="newPassword"
                  returnKeyType="next"
                  style={[styles.inputInner, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={() => setShowNewPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  testID="toggle-new-password-visibility"
                  accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon size={22} color={colors.mutedForeground} off={showNewPassword} />
                </Pressable>
              </View>

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
                  testID="confirm-password-input"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showConfirmPassword}
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={submitReset}
                  style={[styles.inputInner, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  testID="toggle-confirm-password-visibility"
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon size={22} color={colors.mutedForeground} off={showConfirmPassword} />
                </Pressable>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]} testID="error-message">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-reset"
                onPress={submitReset}
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
                    {t.resetAndSignIn ?? "Reset & Sign In"}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep("email");
                  setCode("");
                  setNewPassword("");
                  setError(null);
                  setInfo(null);
                }}
                style={styles.backLinkRow}
              >
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                  ← {t.useDifferentEmail ?? "Use a different email"}
                </Text>
              </Pressable>
            </>
          )}
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
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 4 },
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
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  infoText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  backLinkRow: { alignItems: "center", marginTop: 12 },
});
