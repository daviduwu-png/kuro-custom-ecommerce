import { CreditCard, Lock } from "lucide-react";
import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import { StripeLogo, MPLogo } from "./Logos.jsx";

// ─── Panel de Stripe ────────────────────────────────────────────────────────
function StripePanel({ cardName, setCardName }) {
  const ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#f0f0f0",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSmoothing: "antialiased",
        fontSize: "14px",
        "::placeholder": { color: "#555555" },
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
    },
  };

  return (
    <div className="bg-[#161616] border border-[#2d2d2d] rounded-sm p-5 space-y-4 animate-fade-in mt-3">
      <p className="text-[10px] uppercase tracking-widest font-bold text-[#888888] flex items-center gap-2">
        <Lock size={11} strokeWidth={2} /> Pago seguro de 256 bits — vía Stripe
      </p>

      {/* Número de tarjeta */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-[#888888] block mb-2">Número de tarjeta</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-[14px] text-[#555555] z-10" size={18} />
          <div className="w-full pl-10 border border-[#2d2d2d] rounded-sm px-4 py-3.5 bg-[#1f1f1f] focus-within:border-[#555555] transition">
            <CardNumberElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Vencimiento y CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-[#888888] block mb-2">Vencimiento</label>
          <div className="w-full border border-[#2d2d2d] rounded-sm px-4 py-4 bg-[#1f1f1f] focus-within:border-[#555555] transition">
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-[#888888] block mb-2">CVC</label>
          <div className="w-full border border-[#2d2d2d] rounded-sm px-4 py-4 bg-[#1f1f1f] focus-within:border-[#555555] transition">
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Nombre en la tarjeta */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-[#888888] block mb-2">Nombre en la tarjeta</label>
        <input
          id="stripe-card-name"
          type="text"
          placeholder="Como aparece en la tarjeta"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          className="w-full border border-[#2d2d2d] rounded-sm px-4 py-3 bg-[#1f1f1f] focus:border-[#555555] outline-none text-sm text-[#f0f0f0] transition placeholder-[#555555]"
        />
      </div>
    </div>
  );
}

// ─── Panel de Mercado Pago ────────────────────────────────────────────────────
function MPPanel() {
  const metodos = ["VISA", "MC", "AMEX", "OXXO", "SPEI"];
  return (
    <div className="bg-[#161616] border border-[#2d2d2d] rounded-sm p-5 animate-fade-in mt-3">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[#2d2d2d] border border-[#555555] rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[#f0f0f0] font-bold text-lg">$</span>
        </div>
        <div>
          <p className="font-bold text-[#f0f0f0] text-[10px] uppercase tracking-widest">Paga con Mercado Pago</p>
          <p className="text-[10px] tracking-wide text-[#888888] mt-2">
            Serás redirigido al entorno seguro de Mercado Pago donde podrás utilizar tarjeta, transferencia SPEI,
            efectivo en OXXO o saldo de cuenta.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {metodos.map((m) => (
              <span
                key={m}
                className="bg-[#1f1f1f] border border-[#555555] text-[#888888] text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSelector({ metodoPago, setMetodoPago, cardName, setCardName }) {
  return (
    <section>
      <h2 className="text-[10px] font-bold text-[#f0f0f0] uppercase tracking-widest mb-4 flex items-center gap-3">
        <span className="w-5 h-5 bg-[#f0f0f0] text-[#0e0e0e] rounded-sm flex items-center justify-center text-[10px] font-bold">
          3
        </span>
        Método de Pago
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <button
          id="payment-method-stripe"
          type="button"
          onClick={() => setMetodoPago("stripe")}
          className={`flex items-center justify-center gap-3 p-4 rounded-sm border transition-all ${
            metodoPago === "stripe"
              ? "border-[#f0f0f0] bg-[#161616]"
              : "border-[#2d2d2d] bg-[#161616] hover:border-[#555555]"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${
              metodoPago === "stripe" ? "border-[#f0f0f0]" : "border-[#555555]"
            }`}
          >
            {metodoPago === "stripe" && <div className="w-1.5 h-1.5 bg-[#f0f0f0] rounded-full" />}
          </div>
          <StripeLogo />
        </button>

        <button
          id="payment-method-mercadopago"
          type="button"
          onClick={() => setMetodoPago("mercadopago")}
          className={`flex items-center justify-center gap-3 p-4 rounded-sm border transition-all ${
            metodoPago === "mercadopago"
              ? "border-[#f0f0f0] bg-[#161616]"
              : "border-[#2d2d2d] bg-[#161616] hover:border-[#555555]"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${
              metodoPago === "mercadopago" ? "border-[#f0f0f0]" : "border-[#555555]"
            }`}
          >
            {metodoPago === "mercadopago" && <div className="w-1.5 h-1.5 bg-[#f0f0f0] rounded-full" />}
          </div>
          <MPLogo />
        </button>
      </div>

      {metodoPago === "stripe" && <StripePanel cardName={cardName} setCardName={setCardName} />}

      {metodoPago === "mercadopago" && <MPPanel />}
    </section>
  );
}
