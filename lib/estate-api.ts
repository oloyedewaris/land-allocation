import type { BackendAllocation } from "@/types/estate";

const allocationsUrl =
  "https://dev.matadortrust.com/v2/developers/project-allocations-with-owner/3244/";

interface AllocationResponse {
  message: string;
  data: BackendAllocation[];
  total?: number;
  tot8al?: number;
}

export async function getProjectAllocations(): Promise<BackendAllocation[]> {
  const response = await fetch(allocationsUrl, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Allocation API returned ${response.status}`);
  }

  const payload = (await response.json()) as AllocationResponse;
  if (!Array.isArray(payload.data)) {
    throw new Error("Allocation API response does not contain a data array");
  }

  return payload.data;
}
