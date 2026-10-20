import { useSignIn } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthUnavailable } from "@/components/AuthUnavailable";
import { EyeIcon } from "@/components/EyeIcon";
import { AuthShell, Button, ErrorBanner, TextField } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

type Step = "email" | "reset";

const hasClerk = !!(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");

export default function ForgotPasswordScreen() {
  if (!hasClerk) return <AuthUnavailable />;
  return <ForgotPasswordContent />;
}

function ForgotPasswordContent() {
  const colors = useColors();
  const { t } = useLanguage();
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
  }, [signIn, code, newPassword, confirmPassword, t]);

  return (
    <AuthShell
      title={t.resetTitle ?? "Reset your password"}
      subtitle={
        step === "email"
          ? (t.resetSubEmail ?? "Enter your email and we'll send you a code.")
          : (t.resetSubCode ?? "Enter the code we sent to ") + email
      }
    >
      {step === "email" ? (
        <>
          <TextField
            testID="email-input"
            label={t.email ?? "Email"}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="go"
            onSubmitEditing={sendCode}
            containerStyle={{ marginBottom: 8 }}
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button
            testID="submit-send-code"
            title={t.sendResetCode ?? "Send Reset Code"}
            onPress={sendCode}
            loading={submitting}
          />
        </>
      ) : (
        <>
          {info ? (
            <Text style={[styles.infoText, { color: colors.success }]}>{info}</Text>
          ) : null}

          <TextField
            testID="code-input"
            label={t.verifyCodeLabel ?? "Verification code"}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            style={styles.codeInput}
            containerStyle={{ marginBottom: 4 }}
          />

          <TextField
            testID="new-password-input"
            label={t.newPassword ?? "New password"}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showNewPassword}
            textContentType="newPassword"
            containerStyle={{ marginBottom: 4 }}
            rightAccessory={
              <Pressable
                onPress={() => setShowNewPassword((v) => !v)}
                hitSlop={8}
                testID="toggle-new-password-visibility"
                accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon size={22} color={colors.mutedForeground} off={showNewPassword} />
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
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submitReset}
            containerStyle={{ marginBottom: 4 }}
            rightAccessory={
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={8}
                testID="toggle-confirm-password-visibility"
                accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon size={22} color={colors.mutedForeground} off={showConfirmPassword} />
              </Pressable>
            }
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button
            testID="submit-reset"
            title={t.resetAndSignIn ?? "Reset & Sign In"}
            onPress={submitReset}
            loading={submitting}
          />

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
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  linkText: { fontSize: 14, fontFamily: fonts.medium },
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    fontFamily: fonts.bold,
  },
  infoText: { fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 },
  backLinkRow: { alignItems: "center", marginTop: 12 },
});
