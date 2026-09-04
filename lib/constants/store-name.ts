export const DEFAULT_STORE_NAME = "kenandbridget-dev";

export function store_name(): string {
  return DEFAULT_STORE_NAME;
}

export function business_id(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem("business_id") ?? "";
}
