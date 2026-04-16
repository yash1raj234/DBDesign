/**
 * API client — thin wrapper around fetch for the FastAPI backend.
 * Phase 4 will add SWR hooks and error handling on top of these functions.
 */

import type { ERDSchema, GenerateRequest, GenerateResponse, RefineRequest } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Phase 2 stubs — signatures are final, bodies will be filled in Phase 4.

export async function generateSchema(_req: GenerateRequest): Promise<GenerateResponse> {
  throw new Error("generateSchema not yet implemented — Phase 4.");
}

export async function refineSchema(_req: RefineRequest): Promise<GenerateResponse> {
  throw new Error("refineSchema not yet implemented — Phase 4.");
}

export async function getSchema(_id: string): Promise<ERDSchema> {
  throw new Error("getSchema not yet implemented — Phase 4.");
}

export { BASE_URL };
