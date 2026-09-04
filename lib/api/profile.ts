import { BaseURL } from "../constants/auth-keys";
import { store_name } from "../constants/store-name";
import { axiosInstance } from "./axiosInstance";

export interface GetProfileDataPayload {
  profile?: boolean;
  next_of_kin?: boolean;
  documents?: boolean;
}

export function getProfileData(data: GetProfileDataPayload) {
  return axiosInstance.post(
    `${BaseURL}/store/store_settings?store_name=${encodeURIComponent(store_name())}`,
    data,
  );
}

export function updateProfile(data: Record<string, unknown>) {
  return axiosInstance.patch(
    `${BaseURL}/store/store_settings?store_name=${encodeURIComponent(store_name())}`,
    data,
  );
}
