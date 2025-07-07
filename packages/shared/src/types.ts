// Shared type definitions
export interface BaseUser {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "guest";
}
