"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Cookie/consent state for OPTIONAL external content (Google Maps,
 * AutoScout24 widget, future analytics). Technical cookies (admin
 * session) need no consent. Choice persisted in localStorage.
 */

const STORAGE_KEY = "autostore-consent-v1";

export type ConsentState = "unknown" | "granted" | "denied";

type ConsentContextValue = {
  /** External-content consent; "unknown" until the visitor chooses. */
  external: ConsentState;
  grantExternal: () => void;
  denyExternal: () => void;
  /** Reopens the banner (footer "Preferenze cookie"). */
  reset: () => void;
  /** True after the stored choice has been read (avoids SSR flash). */
  ready: boolean;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStored(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "unknown";
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "external" in parsed &&
      (parsed.external === "granted" || parsed.external === "denied")
    ) {
      return parsed.external;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function store(external: ConsentState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ external, updated_at: new Date().toISOString() }),
    );
  } catch {
    // Private mode / storage full: the banner will simply reappear.
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [external, setExternal] = useState<ConsentState>("unknown");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setExternal(readStored());
    setReady(true);
  }, []);

  const grantExternal = useCallback(() => {
    setExternal("granted");
    store("granted");
  }, []);
  const denyExternal = useCallback(() => {
    setExternal("denied");
    store("denied");
  }, []);
  const reset = useCallback(() => {
    setExternal("unknown");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ external, grantExternal, denyExternal, reset, ready }),
    [external, grantExternal, denyExternal, reset, ready],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent deve essere usato dentro <ConsentProvider>");
  }
  return context;
}
