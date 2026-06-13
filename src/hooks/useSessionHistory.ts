import { useState, useEffect } from "react";

export interface SessionResult {
  wpm: number;
  accuracy: number;
  score?: number;
  date: string; // ISO string
  mode: string; // e.g. "typing" | "voice"
  sessionId?: string;
}

const STORAGE_KEY = "typespeakpro_session_history";

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const saveResult = (result: Omit<SessionResult, "date">) => {
    setHistory((prev) => {
      if (result.sessionId && prev.some((item) => item.sessionId === result.sessionId)) {
        return prev;
      }

      return [
        { ...result, date: new Date().toISOString() },
        ...prev,
      ];
    });
  };

  const clearHistory = () => setHistory([]);

  return { history, saveResult, clearHistory };
}
