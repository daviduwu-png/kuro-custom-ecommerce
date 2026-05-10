import { ShieldCheck, Lock, Truck } from "lucide-react";

export const ENVIO_GRATIS_DESDE = 999;
export const COSTO_ENVIO = 150;

export default function OrderSummary({ items, subtotal, envio, total, className = "" }) {
  const faltaParaGratis = ENVIO_GRATIS_DESDE - subtotal;
  const progresoEnvio = Math.min((subtotal / ENVIO_GRATIS_DESDE) * 100, 100);

  return (
    <div
      className={`w-full lg:w-96 bg-[#161616] p-4 sm:p-6 rounded-sm border border-[#2d2d2d] lg:sticky lg:top-24 h-fit ${className}`.trim()}
    >
      <h3 className="text-[10px] font-bold text-[#f0f0f0] uppercase tracking-widest mb-5">Resumen del Pedido</h3>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-6 custom-scrollbar">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex gap-3">
            <div className="relative w-16 h-16 bg-[#1f1f1f] rounded-sm border border-[#2d2d2d] overflow-hidden flex-shrink-0">
              <img
                src={
                  item.image ||
                  {
                    playeras: "/mockups/playera.png",
                    sudaderas: "/mockups/sudadera.png",
                    gorras: "/mockups/gorra.png",
                    tazas: "/mockups/taza.png",
                    shorts_box: "/mockups/shorts-box.png",
                  }[item.category] ||
                  "/mockups/playera.png"
                }
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-0 right-0 bg-[#f0f0f0] text-[#0e0e0e] text-[9px] w-5 h-5 flex items-center justify-center rounded-bl-sm font-bold">
                {item.cantidad}
              </span>
            </div>

            {/* Nombre y variante */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#f0f0f0] truncate">{item.name}</p>
              <p className="text-[10px] text-[#888888] uppercase tracking-widest mt-1">
                {item.selectedVariant ? `Talla: ${item.selectedVariant.size}` : item.category}
              </p>
            </div>

            {/* Subtotal del item */}
            <p className="text-sm font-bold text-[#f0f0f0] whitespace-nowrap">
              ${(Number(item.price) * item.cantidad).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-5 pb-5 border-b border-[#2d2d2d]">
        <input
          type="text"
          placeholder="Código de descuento"
          className="w-full sm:flex-1 bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:border-[#555555] outline-none placeholder-[#555555]"
        />
        <button
          type="button"
          className="w-full sm:w-auto bg-[#2d2d2d] text-[#f0f0f0] px-4 py-2 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-[#555555] transition"
        >
          Aplicar
        </button>
      </div>

      {/* ── Banner de envío gratis ───────────────────────────────────────────── */}
      {envio === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-2 mb-4 flex items-center gap-2">
          <Truck size={16} className="text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-[10px] uppercase tracking-widest font-bold">Envío gratis aplicado</p>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm px-3 py-2 mb-4">
          <p className="text-amber-400 text-[10px] uppercase tracking-widest font-bold">
            Faltan <span className="text-amber-300 font-bold">${faltaParaGratis.toFixed(2)} MXN</span> para obtener{" "}
            <span className="text-amber-300 font-bold">envío gratis</span>
          </p>
          {/* Barra de progreso */}
          <div className="mt-2 bg-amber-500/20 rounded-sm h-1 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-sm transition-all duration-300"
              style={{ width: `${progresoEnvio}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3 text-[10px] uppercase tracking-widest text-[#888888] font-bold mb-5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold text-[#f0f0f0]">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          {envio === 0 ? (
            <span className="font-bold text-green-400">Gratis</span>
          ) : (
            <span className="font-bold text-[#f0f0f0]">${envio.toFixed(2)} MXN</span>
          )}
        </div>
        <div className="flex justify-between font-bold text-[#f0f0f0] text-sm pt-4 border-t border-[#2d2d2d] mt-4">
          <span>Total</span>
          <span>${total.toFixed(2)} MXN</span>
        </div>
      </div>

      {/* ── Sellos de confianza ──────────────────────────────────────────────── */}
      <div className="space-y-2 mt-6">
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-[#888888] bg-[#1f1f1f] p-3 rounded-sm border border-[#2d2d2d]">
          <ShieldCheck size={14} className="text-[#f0f0f0] flex-shrink-0" />
          <span>Garantía de devolución de 30 días</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-[#888888] bg-[#1f1f1f] p-3 rounded-sm border border-[#2d2d2d]">
          <Lock size={14} className="text-[#f0f0f0] flex-shrink-0" />
          <span>Pago 100% seguro y encriptado</span>
        </div>
      </div>
    </div>
  );
}
