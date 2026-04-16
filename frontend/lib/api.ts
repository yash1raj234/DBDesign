import type { ERDSchema, GenerateRequest, GenerateResponse, RefineRequest } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function generateSchema(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Generate failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<GenerateResponse>;
}

export async function refineSchema(req: RefineRequest): Promise<GenerateResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_schema: req.schema, prompt: req.follow_up }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Refine failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<GenerateResponse>;
}

export async function getSchema(_id: string): Promise<ERDSchema> {
  throw new Error("getSchema not yet implemented.");
}

export { BASE_URL };
