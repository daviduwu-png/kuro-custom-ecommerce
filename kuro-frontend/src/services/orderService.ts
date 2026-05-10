import api from "./api";

export const orderService = {
    async getOrders() {
        try {
            const response = await api.get("/orders/");
            return response.data;
        } catch (error) {
            console.error("Error obteniendo órdenes:", error);
            throw error;
        }
    },

    async createOrder(orderData: any) {
        try {
            const response = await api.post("/orders/", orderData);
            return response.data;
        } catch (error) {
            console.error("Error creando orden:", error);
            throw error;
        }
    },

    async getOrder(orderId: number) {
        try {
            const response = await api.get(`/orders/${orderId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo orden ${orderId}:`, error);
            throw error;
        }
    },

    async updateOrder(orderId: number, data: any) {
        try {
            const response = await api.patch(`/orders/${orderId}/`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando orden ${orderId}:`, error);
            throw error;
        }
    }
};
