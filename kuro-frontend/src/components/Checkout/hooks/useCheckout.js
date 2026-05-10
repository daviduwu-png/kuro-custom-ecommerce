import { useState, useEffect } from "react";
import { sileo } from "sileo";
import { useStore } from "@nanostores/react";
import { cartItems, removeCartItem } from "../../../store/cartStore";
import { orderService } from "../../../services/orderService";
import { paymentService } from "../../../services/paymentService";
import { profileService } from "../../../services/profileService";
import { loadStripe } from "@stripe/stripe-js";
import { useStripe, useElements, CardNumberElement } from "@stripe/react-stripe-js";
import { ENVIO_GRATIS_DESDE, COSTO_ENVIO } from "../components/OrderSummary.jsx";

// Cargar Stripe una sola vez fuera del hook (evita re-creación en cada render)
export const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export function useCheckout() {
  const stripe = useStripe();
  const elements = useElements();
  // ── Carrito ───────────────────────────────────────────────────────────────────
  const $cartItems = useStore(cartItems);
  const items = Object.values($cartItems);

  // ── Formulario de contacto ────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // ── Formulario de envío ───────────────────────────────────────────────────────
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");

  // ── Hidratación SSR y prellenado ──────────────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);

    const userEmail = localStorage.getItem("user_email");
    if (userEmail) {
      setEmail(userEmail);
    }
  }, []); // Solo al montar — no re-ejecutar en cada cambio de email/nombre

  // ── Totales ───────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, item) => acc + Number(item.price) * item.cantidad, 0);
  const envio = subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
  const total = subtotal + envio;
  const [calle, setCalle] = useState("");
  const [colonia, setColonia] = useState("");
  const [cp, setCp] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");

  // ── Direcciones Guardadas ─────────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // Solo intentar si hay un token (usuario autenticado)
        if (localStorage.getItem("access_token")) {
          const data = await profileService.getAddresses();
          setSavedAddresses(data);

          // Si tiene una dirección predeterminada, seleccionarla automáticamente
          const defaultAddress = data.find((addr) => addr.is_default) || data[0];
          if (defaultAddress) {
            handleSelectAddress(defaultAddress.id.toString(), data);
          }
        }
      } catch (error) {
        console.error("Error al cargar direcciones guardadas", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (isMounted) {
      fetchAddresses();
    }
  }, [isMounted]);

  const handleSelectAddress = (id, addresses = savedAddresses) => {
    setSelectedAddressId(id);

    if (id === "new") {
      // Limpiar formulario
      setCalle("");
      setColonia("");
      setCp("");
      setCiudad("");
      setEstado("");
      return;
    }

    const address = addresses.find((a) => a.id.toString() === id);
    if (address) {
      // Llenar formulario con la dirección guardada
      const fullStreet = address.interior_number
        ? `${address.street} ${address.exterior_number} Int ${address.interior_number}`
        : `${address.street} ${address.exterior_number}`;

      setCalle(fullStreet);
      setColonia(address.neighborhood);
      setCp(address.postal_code);
      setCiudad(address.city);
      setEstado(address.state || "");
      if (address.phone && !telefono) setTelefono(address.phone);
    }
  };

  // ── Datos de tarjeta (Stripe) ─────────────────────────────────────────────────
  const [cardName, setCardName] = useState("");

  // ── Estado del proceso de pago ────────────────────────────────────────────────
  const [metodoPago, setMetodoPago] = useState("stripe"); // "stripe" | "mercadopago"
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState(null);

  const buildShippingAddress = () =>
    JSON.stringify({
      name: `${nombre} ${apellidos}`,
      street: calle,
      neighborhood: colonia,
      city: ciudad,
      state: estado,
      zip: cp,
      phone: telefono,
    });

  /** Items en formato que espera POST /api/orders/ */
  const buildOrderItems = () =>
    items.map((item) => ({
      product: item.id,
      variant: item.selectedVariant?.id || null,
      quantity: item.cantidad,
      is_customized: !!item.customization,
    }));

  const clearCart = () => {
    Object.keys($cartItems).forEach((key) => removeCartItem(key));
  };

  const validateForm = () => {
    if (!email || !nombre || !apellidos || !calle || !colonia || !cp || !ciudad) {
      sileo.error({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos de contacto y envío.",
      });
      return false;
    }
    return true;
  };

  /**
   * Flujo Stripe:
   *  1. Crear orden en el backend (status = pending)
   *  2. Crear PaymentIntent vía nuestro backend
   *  3. Confirmar pago con Stripe.js (confirmCardPayment)
   *  4. Actualizar la orden con stripe_payment_id y status = paid
   */
  const handlePagarStripe = async () => {
    if (!validateForm()) return;

    if (metodoPago === "stripe" && !cardName) {
      sileo.error({ title: "Datos incompletos", description: "Completa el nombre de la tarjeta." });
      return;
    }

    setLoadingOrder(true);
    try {
      // 1. Crear la orden en el backend (status = pending)
      const createdOrder = await orderService.createOrder({
        shipping_address: buildShippingAddress(),
        items: buildOrderItems(),
      });

      // 2. Pedir el PaymentIntent al backend pasando el order_id
      //    El backend toma el monto de la BD (no del frontend → más seguro)
      const { client_secret } = await paymentService.createStripeIntent(createdOrder.id);

      if (!stripe || !elements || !client_secret) {
        throw new Error("No se pudo inicializar Stripe. Verifica tu conexión o clave pública.");
      }

      // 3. Confirmar el pago con Stripe.js
      const cardElement = elements.getElement(CardNumberElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: cardName, email },
        },
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent?.status === "succeeded") {
        // En desarrollo local (o como respaldo si falla el webhook),
        // avisamos explícitamente al backend para que sincronice la BD y corra Skydropx localmente.
        try {
          await paymentService.verifyStripePayment(createdOrder.id);
        } catch (verifyErr) {
          console.error("Error validando el pago manualmente con el backend:", verifyErr);
        }

        // Ya validado, limpiar carrito y mostrar éxito.
        clearCart();
        setOrderSuccessId(createdOrder.id);
        setOrderSuccess(true);
        setTimeout(() => {
          window.location.href = `/pago-exitoso?order=${createdOrder.id}`;
        }, 1500);
      } else {
        throw new Error("El pago no fue confirmado por Stripe. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error(error);
      sileo.error({
        title: "Error al procesar el pago",
        description: error.message || "Inténtalo de nuevo.",
      });
    } finally {
      setLoadingOrder(false);
    }
  };

  /**
   * Flujo Mercado Pago:
   *  1. Crear orden en el backend (status = pending)
   *  2. Crear Preference en MP vía nuestro backend
   *  3. Redirigir al checkout de MP (sandbox_init_point en TEST, init_point en PROD)
   */
  const handlePagarMP = async () => {
    if (!validateForm()) return;

    setLoadingOrder(true);
    try {
      // 1. Crear la orden en el backend (status = pending)
      const createdOrder = await orderService.createOrder({
        shipping_address: buildShippingAddress(),
        items: buildOrderItems(),
      });

      // 2. Pedir la Preference a MP pasando el order_id
      //    El backend construye los items desde la BD (no del frontend → más seguro)
      const { sandbox_init_point, init_point } = await paymentService.createMPPreference(createdOrder.id);

      const redirectUrl = sandbox_init_point || init_point;
      if (!redirectUrl) {
        throw new Error("No se recibió la URL de pago de Mercado Pago.");
      }

      // 3. Limpiar carrito ANTES de redirigir
      clearCart();
      window.location.href = redirectUrl;
    } catch (error) {
      console.error(error);
      sileo.error({
        title: "Error de Mercado Pago",
        description: error.message || "Hubo un error al iniciar el pago con Mercado Pago.",
      });
    } finally {
      setLoadingOrder(false);
    }
  };

  // ─── Valor de retorno del hook ────────────────────────────────────────────────
  return {
    // Carrito e hidratación
    items,
    isMounted,
    // Totales
    subtotal,
    envio,
    total,
    // Contacto
    email,
    setEmail,
    telefono,
    setTelefono,
    // Dirección
    nombre,
    setNombre,
    apellidos,
    setApellidos,
    calle,
    setCalle,
    colonia,
    setColonia,
    cp,
    setCp,
    ciudad,
    setCiudad,
    estado,
    setEstado,
    // Direcciones Guardadas
    savedAddresses,
    selectedAddressId,
    handleSelectAddress,
    loadingAddresses,
    // Tarjeta Stripe
    cardName,
    setCardName,
    // Estado del pago
    metodoPago,
    setMetodoPago,
    loadingOrder,
    orderSuccess,
    orderSuccessId,
    // Handlers
    handlePagarStripe,
    handlePagarMP,
  };
}
