import { CreditCard as CardIcon, CheckCircle, Lock, ChevronRight, Loader2 } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { useCheckout, stripePromise } from "./hooks/useCheckout.js";
import ContactInfo from "./components/ContactInfo.jsx";
import ShippingAddress from "./components/ShippingAddress.jsx";
import PaymentSelector from "./components/PaymentSelector.jsx";
import OrderSummary from "./components/OrderSummary.jsx";

function CheckoutFormInner() {
  const {
    items,
    isMounted,
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
    // Direcciones guardadas
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
  } = useCheckout();

  if (!isMounted) return null;

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="text-center py-20 animate-fade-in bg-[#161616] border border-[#2d2d2d] rounded-sm max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-[#1f1f1f] border border-[#555555] rounded-sm flex items-center justify-center mx-auto mb-6">
          <CardIcon size={24} className="text-[#888888]" />
        </div>
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#f0f0f0] mb-3">Tu bóveda está vacía</h2>
        <p className="text-[10px] text-[#888888] mb-8 uppercase tracking-widest font-bold">Selecciona algunos artículos antes de proceder.</p>
        <a
          href="/catalogo"
          className="bg-[#f0f0f0] text-[#0e0e0e] px-8 py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-white transition"
        >
          Explorar piezas
        </a>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="text-center py-20 animate-fade-in max-w-md mx-auto bg-[#161616] border border-[#2d2d2d] rounded-sm p-8">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-sm flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-green-400" />
        </div>
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#f0f0f0] mb-2">¡Transacción confirmada!</h2>
        {orderSuccessId && (
          <p className="text-[12px] text-[#f0f0f0] font-bold tracking-widest mb-4">#ORD-{String(orderSuccessId).padStart(3, "0")}</p>
        )}
        <p className="text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-8 leading-relaxed">
          Tu adquisición ha sido procesada correctamente. Serás redirigido a tu bóveda en unos instantes.
        </p>
        <a
          href="/cuenta"
          className="bg-[#f0f0f0] text-[#0e0e0e] px-8 py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-white transition"
        >
          Ver mis adquisiciones
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start animate-fade-in">
      <div className="flex-1 w-full space-y-8">
        <ContactInfo email={email} setEmail={setEmail} telefono={telefono} setTelefono={setTelefono} />

        <ShippingAddress
          nombre={nombre}
          setNombre={setNombre}
          apellidos={apellidos}
          setApellidos={setApellidos}
          calle={calle}
          setCalle={setCalle}
          colonia={colonia}
          setColonia={setColonia}
          cp={cp}
          setCp={setCp}
          ciudad={ciudad}
          setCiudad={setCiudad}
          estado={estado}
          setEstado={setEstado}
          savedAddresses={savedAddresses}
          selectedAddressId={selectedAddressId}
          handleSelectAddress={handleSelectAddress}
          loadingAddresses={loadingAddresses}
        />

        <PaymentSelector
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          cardName={cardName}
          setCardName={setCardName}
        />

        <div className="lg:hidden">
          <OrderSummary items={items} subtotal={subtotal} envio={envio} total={total} />
        </div>

        <button
          id="checkout-pay-button"
          type="button"
          onClick={metodoPago === "stripe" ? handlePagarStripe : handlePagarMP}
          disabled={loadingOrder}
          className={`w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            metodoPago === "stripe"
              ? "bg-[#f0f0f0] hover:bg-white text-[#0e0e0e]"
              : "bg-[#009EE3] hover:bg-[#0088cc] text-white border border-[#009EE3]"
          }`}
        >
          {loadingOrder ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Lock size={14} className="shrink-0" />
              <span className="whitespace-nowrap">
                {metodoPago === "stripe"
                  ? `Pagar $${total.toFixed(2)} MXN`
                  : `Ir a Mercado Pago · $${total.toFixed(2)} MXN`}
              </span>
              <ChevronRight size={14} className="shrink-0" />
            </>
          )}
        </button>

        <p className="text-[9px] uppercase tracking-widest font-bold text-center text-[#555555]">
          Al confirmar la transacción, aceptas nuestros Términos y Condiciones y Política de Privacidad.
        </p>
      </div>

      <div className="hidden lg:block">
        <OrderSummary items={items} subtotal={subtotal} envio={envio} total={total} />
      </div>
    </div>
  );
}

export default function CheckoutForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormInner />
    </Elements>
  );
}
