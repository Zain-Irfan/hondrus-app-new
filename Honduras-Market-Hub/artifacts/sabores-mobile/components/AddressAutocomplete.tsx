import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/api";

export interface ParsedAddress {
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (line1: string) => void;
  onAddressSelected: (parsed: ParsedAddress) => void;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  label,
  value,
  onChange,
  onAddressSelected,
  placeholder,
  required = true,
}: Props) {
  const colors = useColors();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqRef = useRef(0);
  const detailsReqRef = useRef(0);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const myReq = ++reqRef.current;
      setLoading(true);
      try {
        const res = await apiFetch(`/places/autocomplete?input=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error("autocomplete failed");
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (myReq !== reqRef.current) return;
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 8) : []);
        setOpen(true);
      } catch {
        if (myReq !== reqRef.current) return;
        setSuggestions([]);
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handleSelect(s: Suggestion) {
    justSelectedRef.current = true;
    reqRef.current++;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOpen(false);
    setSuggestions([]);
    setLoading(false);
    const myReq = ++detailsReqRef.current;
    try {
      const res = await apiFetch(`/places/details?placeId=${encodeURIComponent(s.placeId)}`);
      if (myReq !== detailsReqRef.current) return;
      if (!res.ok) throw new Error("details failed");
      const parsed = (await res.json()) as ParsedAddress;
      if (parsed.line1) onChange(parsed.line1);
      onAddressSelected(parsed);
    } catch {
      if (myReq !== detailsReqRef.current) return;
      onChange(s.mainText || s.description);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {label}
        {required && " *"}
      </Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.mutedForeground}
          autoCorrect={false}
          autoCapitalize="words"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.mutedForeground}
            style={styles.spinner}
          />
        )}
      </View>
      {open && suggestions.length > 0 && (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={s.placeId}
              onPress={() => handleSelect(s)}
              style={({ pressed }) => [
                styles.row,
                i < suggestions.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
                pressed && { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.rowMain, { color: colors.foreground }]} numberOfLines={1}>
                {s.mainText ?? s.description}
              </Text>
              {s.secondaryText && (
                <Text
                  style={[styles.rowSecondary, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {s.secondaryText}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    height: 48,
  },
  spinner: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
  },
  list: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rowMain: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowSecondary: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
});
