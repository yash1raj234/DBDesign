"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { GenerateResponse } from "@/lib/types";

interface SchemaContextValue {
  result: GenerateResponse | null;
  setResult: (r: GenerateResponse) => void;
}

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  return (
    <SchemaContext.Provider value={{ result, setResult }}>
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchemaContext(): SchemaContextValue {
  const ctx = useContext(SchemaContext);
  if (!ctx) throw new Error("useSchemaContext must be used inside SchemaProvider");
  return ctx;
}
