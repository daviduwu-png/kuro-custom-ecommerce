import api from "./api";
import { userInfo } from "../store/userStore";

export const authService = {
  async register(userData: any) {
    try {
      const response = await api.post("/register/", userData);
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },

  async login(credentials: any) {
    try {
      const response = await api.post("/login/", credentials);

      if (response.data.access) {
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);

        if (response.data.user_name) {
          localStorage.setItem("user_name", response.data.user_name);
          localStorage.setItem("user_email", response.data.user_email);

          userInfo.set({
            name: response.data.user_name,
            email: response.data.user_email,
          });
        }
      }
      return response.data;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },

  async googleLogin(credential: string) {
    try {
      const response = await api.post("/auth/google/", {
        access_token: credential, // requerido por dj-rest-auth para que valide el payload
        id_token: credential, // Token JWT (ID Token) con los datos del usuario para el social adapter
      });

      const accessToken = response.data.access || response.data.access_token;
      const refreshToken = response.data.refresh || response.data.refresh_token;

      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

        // A veces user.first_name no viene, usamos lo que de el user model
        const userName = response.data.user?.first_name || response.data.user?.username || 'Usuario';
        const userEmail = response.data.user?.email || '';

        localStorage.setItem("user_name", userName);
        localStorage.setItem("user_email", userEmail);

        userInfo.set({
          name: userName,
          email: userEmail,
        });
      }
      return response.data;
    } catch (error) {
      console.error("Error en google login:", error);
      throw error;
    }
  },
};
