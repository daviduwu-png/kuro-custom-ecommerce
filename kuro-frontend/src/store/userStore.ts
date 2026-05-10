import { atom } from "nanostores";

export type UserInfo = {
  name: string;
  email: string;
} | null;

export const userInfo = atom<UserInfo>(null);

export function initUser() {
  if (typeof window !== "undefined") {
    const storedName = localStorage.getItem("user_name");
    const storedEmail = localStorage.getItem("user_email");

    if (storedName && storedEmail) {
      userInfo.set({ name: storedName, email: storedEmail });
    }
  }
}

export function logout() {
  userInfo.set(null);
  localStorage.clear();
  window.location.href = "/login";
}
