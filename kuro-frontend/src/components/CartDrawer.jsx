import { useState, useEffect } from "react";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@nanostores/react";
import { isCartOpen, cartItems, addCartItem, removeCartItem, decreaseCartItem } from "../store/cartStore";

export default function CartDrawer() {
  const $isCartOpen = useStore(isCartOpen);
  const $cartItems = useStore(cartItems);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const itemsArray = Object.values($cartItems);

  const total = itemsArray.reduce((acc, item) => acc + Number(item.price) * item.cantidad, 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-[#0e0e0e]/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          $isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => isCartOpen.set(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#161616] border-l border-[#2d2d2d] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          $isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-[#2d2d2d]">
            <h2 className="text-sm font-bold flex items-center gap-3 tracking-widest uppercase text-[#f0f0f0]">
              <ShoppingBag size={18} strokeWidth={1.5} />
              Bóveda ({isMounted ? itemsArray.length : 0})
            </h2>
            <button onClick={() => isCartOpen.set(false)} className="p-2 text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1f1f1f] rounded-sm transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isMounted && itemsArray.length > 0 ? (
              itemsArray.map((item) => (
                <div key={item.cartItemId} className="flex gap-5 animate-fade-in">
                  <div className="w-20 h-20 bg-[#1f1f1f] rounded-sm overflow-hidden flex-shrink-0 border border-[#2d2d2d]">
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
                      className="w-full h-full object-cover p-1"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-[#f0f0f0] line-clamp-1 text-sm tracking-wide">{item.name}</h3>

                      <p className="text-[10px] text-[#888888] uppercase tracking-widest mt-1">
                        Dimensión: {item.selectedVariant ? item.selectedVariant.size : "Única"}
                      </p>
                      <p className="text-[10px] text-[#888888] uppercase tracking-widest mt-0.5">Clase: {item.category}</p>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="font-light text-[#f0f0f0] tracking-wide text-sm">${item.price}</span>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-[#2d2d2d] rounded-sm bg-[#0e0e0e]">
                          <button
                            onClick={() => decreaseCartItem(item.cartItemId)}
                            className="px-2 py-0.5 hover:bg-[#1f1f1f] text-[#888888] hover:text-[#f0f0f0] transition-colors font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="text-[10px] px-2 font-medium min-w-[20px] text-center text-[#f0f0f0]">{item.cantidad}</span>
                          <button
                            onClick={() => addCartItem(item)}
                            disabled={item.selectedVariant && item.cantidad >= item.selectedVariant.stock}
                            className={`px-2 py-0.5 font-bold transition-colors text-xs ${
                              item.selectedVariant && item.cantidad >= item.selectedVariant.stock
                                ? "text-[#2d2d2d] cursor-not-allowed"
                                : "text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1f1f1f]"
                            }`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeCartItem(item.cartItemId)}
                          className="text-[#555555] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <ShoppingBag size={40} strokeWidth={1} className="text-[#2d2d2d]" />
                <p className="text-[#555555] font-light text-sm uppercase tracking-widest">Bóveda vacía.</p>
                <button onClick={() => isCartOpen.set(false)} className="text-[#f0f0f0] text-xs font-bold uppercase tracking-widest hover:text-[#888888] transition-colors border-b border-[#f0f0f0] hover:border-[#888888] pb-1">
                  Explorar
                </button>
              </div>
            )}
          </div>

          {isMounted && itemsArray.length > 0 && (
            <div className="p-6 border-t border-[#2d2d2d] bg-[#0e0e0e]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[#888888] text-xs uppercase tracking-widest">Subtotal</span>
                <span className="text-lg font-light text-[#f0f0f0] tracking-wide">${total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-[#555555] mb-6 text-center uppercase tracking-widest font-light">Impuestos y envío calculados al proceder.</p>
              <a
                href="/checkout"
                className="w-full bg-[#f0f0f0] text-[#0e0e0e] py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-colors active:scale-[0.98]"
              >
                Proceder <ArrowRight size={16} strokeWidth={2} />
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
