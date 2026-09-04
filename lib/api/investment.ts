import { BaseURL } from "../constants/auth-keys";
import { axiosInstance } from "./axiosInstance";

export function fetchProjectBundles(projectId?: number) {
  return axiosInstance.get(`${BaseURL}/investment/project-bundles/?project_id=${projectId}`);
}

export function fetchBundlePaymentPlans(bundleId?: number) {
  return axiosInstance.get(`${BaseURL}/investment/bundle-paymentplans/?bundle_id=${bundleId}`);
}

export function fetchProjectDocumentsQuery(query: string) {
  return axiosInstance.get(`${BaseURL}/developers/project-documents?${query}`);
}

export function makeEquityPayment(body: Record<string, unknown>) {
  return axiosInstance.post(`${BaseURL}/investment/equity/?e_sub=true`, body);
}
