import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ParsedAddress {
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress?: string;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface Props {
  value: string;
  onChange: (line1: string) => void;
  onAddressSelected: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelected,
  placeholder,
  className,
  id,
  required,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const reqRef = useRef(0);
  const detailsReqRef = useRef(0);
  const justSelectedRef = useRef(false);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced fetch on value change
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const myReq = ++reqRef.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error("autocomplete failed");
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (myReq !== reqRef.current) return;
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 8) : []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        if (myReq !== reqRef.current) return;
        setSuggestions([]);
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function selectSuggestion(s: Suggestion) {
    // Invalidate any in-flight or upcoming autocomplete fetches so a stale
    // response cannot reopen the dropdown after selection.
    justSelectedRef.current = true;
    reqRef.current++;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
    setLoading(false);
    const myReq = ++detailsReqRef.current;
    try {
      const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(s.placeId)}`);
      if (myReq !== detailsReqRef.current) return;
      if (!res.ok) throw new Error("details failed");
      const parsed = (await res.json()) as ParsedAddress;
      if (parsed.line1) onChange(parsed.line1);
      onAddressSelected(parsed);
    } catch {
      if (myReq !== detailsReqRef.current) return;
      // Fall back to using the description text as the line1.
      onChange(s.mainText || s.description);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        required={required}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn("bg-background", className)}
        spellCheck={false}
        data-gramm="false"
        data-testid="address-autocomplete-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIdx >= 0 ? optionId(activeIdx) : undefined
        }
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground pointer-events-none" />
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          className="absolute z-50 left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto"
          role="listbox"
          data-testid="address-autocomplete-list"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIdx}
              className={cn(
                "px-4 py-2.5 cursor-pointer text-sm border-b last:border-b-0 transition-colors",
                i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              data-testid="address-autocomplete-item"
            >
              <div className="font-medium leading-tight">{s.mainText ?? s.description}</div>
              {s.secondaryText && (
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.secondaryText}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
