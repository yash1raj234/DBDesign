import type { GenerateResponse } from "@/lib/types";

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  result: GenerateResponse;
}

const STORAGE_KEY = "dbdesign_history";
const MAX_ITEMS = 10;

export function saveToHistory(prompt: string, result: GenerateResponse): void {
  if (typeof window === "undefined") return;
  const item: HistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    prompt,
    result,
  };
  const prev = getHistory();
  const next = [item, ...prev].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota exceeded — drop oldest and retry
    const trimmed = [item, ...prev].slice(0, Math.floor(MAX_ITEMS / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
