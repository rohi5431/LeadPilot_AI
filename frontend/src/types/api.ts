/**
 * Types for API responses.
 * No "any" — every field is explicitly typed.
 */

export interface HealthResponse {
  status: string;
  service: string;
}

export interface RootResponse {
  message: string;
}
