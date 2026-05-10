import api from "./api";

export const refundService = {
    /**
     * POST /api/payments/refund/
     * Solo accesible por administradores (is_staff=True).
     * Reembolsa la orden independientemente de si fue pagada con Stripe o Mercado Pago.
     * Devuelve: { refund_id, status, message }
     */
    async refundOrder(orderId: number) {
        const response = await api.post("/payments/refund/", {
            order_id: orderId,
        });
        return response.data;
    },
};
