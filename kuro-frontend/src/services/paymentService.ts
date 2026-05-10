import api from "./api";

export const paymentService = {
  /**
   * Stripe — solicita al backend un PaymentIntent y devuelve el client_secret
   * para confirmar el pago desde el frontend con @stripe/stripe-js.
   * El backend toma el monto directamente de la orden (más seguro).
   */
  async createStripeIntent(orderId: number) {
    const response = await api.post("/payments/stripe/create-intent/", {
      order_id: orderId,
    });
    return response.data; // { client_secret, publishable_key }
  },

  async verifyStripePayment(orderId: number) {
    const response = await api.post("/payments/stripe/verify/", {
      order_id: orderId,
    });
    return response.data;
  },

  /**
   * Mercado Pago — solicita al backend una Preference y devuelve el
   * sandbox_init_point (test) e init_point (producción).
   * El backend construye los items desde la orden en DB (más seguro).
   */
  async createMPPreference(orderId: number) {
    const response = await api.post("/payments/mercadopago/create-preference/", { order_id: orderId });
    return response.data; // { preference_id, init_point, sandbox_init_point }
  },
};
