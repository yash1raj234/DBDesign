import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — used by shadcn/ui components. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
