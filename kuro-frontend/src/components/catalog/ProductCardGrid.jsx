import { addCartItem } from "../../store/cartStore";
import { ShoppingCart } from "lucide-react";

const MOCKUPS = {
  playeras: "/mockups/playera.png",
  sudaderas: "/mockups/sudadera.png",
  gorras: "/mockups/gorra.png",
  tazas: "/mockups/taza.png",
  shorts_box: "/mockups/shorts-box.png",
};

const getCategoryLabel = (category) => {
  const labels = {
    todos: "Todos",
    shorts_box: "Shorts para box",
    "sin-categoria": "Sin categoría",
  };
  const safe = category || "sin-categoria";
  return labels[safe] || safe.replace(/_/g, " ");
};

export default function ProductCardGrid({ producto }) {
  const image = producto.image || MOCKUPS[producto.category] || "/mockups/playera.png";

  return (
    <div
      onClick={() => (window.location.href = `/producto/${producto.slug}`)}
      className="group bg-[#161616] rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border border-[#2d2d2d] hover:border-[#555555] overflow-hidden cursor-pointer flex flex-col"
    >
      <div className="aspect-square overflow-hidden bg-[#1f1f1f] relative">
        <img
          src={image}
          alt={producto.name || "Producto"}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        <div className="absolute inset-0 flex items-end justify-end p-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addCartItem(producto);
            }}
            title="Añadir a la bóveda"
            className="bg-[#2d2d2d] text-[#f0f0f0] rounded-sm shadow-lg hover:bg-[#f0f0f0] hover:text-[#0e0e0e] transition-all duration-200 w-10 h-10 flex items-center justify-center md:translate-y-2 md:group-hover:translate-y-0"
          >
            <ShoppingCart size={17} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 font-bold">
          {getCategoryLabel(producto.category)}
        </p>
        <h3 className="text-sm font-bold text-[#f0f0f0] leading-snug tracking-wide uppercase">{producto.name || "Producto"}</h3>
        <p className="text-[#f0f0f0] font-light mt-auto pt-3 text-base">
          ${Number(producto.price || 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
