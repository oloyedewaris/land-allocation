import { BaseURL } from "../constants/auth-keys";
import { business_id } from "../constants/store-name";
import { axiosInstance } from "./axiosInstance";

export function requestOTPForEmailVerification(data: { email: string; verify?: boolean }) {
  return axiosInstance.post(`${BaseURL.replace("v2", "v1")}/user/create_totp_email_extended`, {
    ...data,
    business_id: business_id(),
  });
}

export function loginWithOTP(data: { email: string; code: string }) {
  return axiosInstance.post(`${BaseURL}/store/direct-purchase/`, {
    email: data.email.trim(),
    code: data.code,
    business_id: business_id(),
  });
}

export interface RegisterUserPayload {
  store_name: string;
  email: string;
  gender?: string;
  phone?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  ref_id?: string;
  [key: string]: unknown;
}

export function registerUser(data: RegisterUserPayload, passToken = true) {
  return axiosInstance.post(`${BaseURL}/store/customers/${passToken ? "?verify=true" : ""}`, data);
}
