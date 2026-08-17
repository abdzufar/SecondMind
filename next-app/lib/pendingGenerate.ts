import type { GenerateMindmapInput } from "@/lib/api";

let pending: GenerateMindmapInput | null = null;

export function setPendingGenerateInput(input: GenerateMindmapInput) {
  pending = input;
}

export function takePendingGenerateInput(): GenerateMindmapInput | null {
  const value = pending;
  pending = null;
  return value;
}
