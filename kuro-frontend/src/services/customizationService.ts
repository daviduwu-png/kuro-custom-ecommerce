import api from "./api";

export const customizationService = {
    async createCustomization(customizationData: any) {
        try {
            const response = await api.post("/customizations/", customizationData);
            return response.data;
        } catch (error) {
            console.error("Error creando personalización:", error);
            throw error;
        }
    },

    async getCustomization(customizationId: number) {
        try {
            const response = await api.get(`/customizations/${customizationId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo personalización ${customizationId}:`, error);
            throw error;
        }
    },

    async updateCustomization(customizationId: number, data: any) {
        try {
            const response = await api.put(`/customizations/${customizationId}/`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando personalización ${customizationId}:`, error);
            throw error;
        }
    }
};
