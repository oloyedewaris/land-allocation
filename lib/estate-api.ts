import type { BackendAllocation } from "@/types/estate";
import { BaseURL, LOCAL_ESUB_DOMAIN } from "./constants/auth-keys";

const allocationsUrl = `${BaseURL}/developers/project-allocations-with-owner/3244/`;
const storeCheckUrl = `${BaseURL}/billing/esub/domain/${encodeURIComponent(LOCAL_ESUB_DOMAIN)}/`;

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

export async function getEsubDetails(): Promise<any> {
  const response = await fetch(storeCheckUrl, { cache: "no-store" });
  if (!response.ok)
    throw new Error(
      `Could not load apartment allocations (${response.status} ${response.statusText}).`,
    );

  const payload = (await response.json()) as any;
  return payload;
}
