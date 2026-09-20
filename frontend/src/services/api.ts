import axios, { AxiosError } from "axios";
import type { ApiResponse } from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  withXSRFToken: true,
  timeout: 20000,
  adapter: "fetch",
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let csrfPromise: Promise<void> | null = null;

export async function ensureCsrf() {
  if (!csrfPromise) {
    csrfPromise = axios
      .get("/sanctum/csrf-cookie", {
        withCredentials: true,
        withXSRFToken: true,
        adapter: "fetch",
      })
      .then(() => undefined)
      .catch((error) => {
        csrfPromise = null;
        throw error;
      });
  }
  await csrfPromise;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
}

export function getFieldErrors(error: unknown) {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  return axiosError.response?.data?.errors ?? {};
}
