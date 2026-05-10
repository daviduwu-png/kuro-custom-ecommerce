import { useState } from "react";
import { addCartItem } from "../store/cartStore";
import { ShoppingBag, Truck, ShieldCheck, Ruler } from "lucide-react";
import { sileo } from "sileo";
import { getCategoryLabel } from "./ProductCustomizer/utils/mockupUtils.jsx";

const CATEGORY_MOCKUPS = {
  playeras: "/mockups/playera.png",
  sudaderas: "/mockups/sudadera.png",
  gorras: "/mockups/gorra.png",
  tazas: "/mockups/taza.png",
  shorts_box: "/mockups/shorts-box.png",
};

function getProductImage(product) {
  if (product.image) return product.image;
  return CATEGORY_MOCKUPS[product.category] || "/mockups/playera.png";
}

export default function ProductDetail({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      sileo.info({ 
        title: "Por favor selecciona una talla."
      });
      return;
    }

    const productToAdd = {
      ...product,
      selectedVariant: selectedVariant,
    };

    addCartItem(productToAdd);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      <div className="flex-1">
        <div className="bg-[#161616] border border-[#2d2d2d] rounded-sm overflow-hidden aspect-square sticky top-24">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90"
          />
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div>
          <span className="text-[#888888] font-bold tracking-[0.2em] text-xs uppercase border border-[#2d2d2d] bg-[#1f1f1f] px-3 py-1.5 rounded-sm">
            {getCategoryLabel(product.category)}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#f0f0f0] mt-6 mb-3 uppercase tracking-widest">{product.name}</h1>
          <p className="text-2xl font-light text-[#f0f0f0] tracking-wide">${product.price}</p>
        </div>

        <div className="prose text-[#888888] leading-relaxed font-light text-sm">
          <p>{product.description || "Sin descripción disponible para este producto."}</p>
        </div>

        {product.variants && product.variants.length > 0 && (
          <div className="pt-4 border-t border-[#2d2d2d]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#f0f0f0] text-xs uppercase tracking-widest">Selecciona tu talla</h3>
              <button className="text-xs text-[#888888] font-bold flex items-center gap-2 hover:text-[#f0f0f0] transition-colors uppercase tracking-widest">
                <Ruler size={14} /> Guía de tallas
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const isOutOfStock = variant.stock <= 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={isOutOfStock}
                    className={`
                                    min-w-[3.5rem] h-12 rounded-sm border font-bold text-xs uppercase tracking-widest transition-all
                                    ${
                                      isSelected
                                        ? "border-[#f0f0f0] bg-[#f0f0f0] text-[#0e0e0e]"
                                        : "border-[#2d2d2d] bg-[#161616] text-[#888888] hover:border-[#555555] hover:text-[#f0f0f0]"
                                    }
                                    ${isOutOfStock ? "opacity-30 cursor-not-allowed line-through bg-[#0e0e0e]" : ""}
                                `}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            {selectedVariant && selectedVariant.stock < 5 && selectedVariant.stock > 0 && (
              <p className="text-[#f0f0f0] text-xs font-bold mt-4 uppercase tracking-widest animate-pulse">
                ¡Solo quedan {selectedVariant.stock} piezas!
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4 pt-6 border-t border-[#2d2d2d]">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-[#f0f0f0] text-[#0e0e0e] h-14 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <ShoppingBag size={18} strokeWidth={2} />
            Agregar al Carrito
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-[#555555]">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-[#888888]" />
            <span>Envío gratis $999</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-[#888888]" />
            <span>Garantía Kuro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
