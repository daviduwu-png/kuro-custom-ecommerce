import api from "./api";

export const profileService = {
    async getProfile() {
        try {
            const response = await api.get("/profile/");
            return response.data;
        } catch (error) {
            console.error("Error obteniendo el perfil de usuario:", error);
            throw error;
        }
    },

    async updateProfile(profileData: any) {
        try {
            const response = await api.put("/profile/", profileData);
            return response.data;
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            throw error;
        }
    },

    async getAddresses() {
        try {
            const response = await api.get("/addresses/");
            return response.data;
        } catch (error) {
            console.error("Error obteniendo direcciones:", error);
            throw error;
        }
    },

    async addAddress(addressData: any) {
        try {
            const response = await api.post("/addresses/", addressData);
            return response.data;
        } catch (error) {
            console.error("Error creando dirección:", error);
            throw error;
        }
    },

    async updateAddress(addressId: number, addressData: any) {
        try {
            const response = await api.put(`/addresses/${addressId}/`, addressData);
            return response.data;
        } catch (error) {
            console.error("Error actualizando dirección:", error);
            throw error;
        }
    },

    async deleteAddress(addressId: number) {
        try {
            const response = await api.delete(`/addresses/${addressId}/`);
            return response.data;
        } catch (error) {
            console.error("Error eliminando dirección:", error);
            throw error;
        }
    }
};
