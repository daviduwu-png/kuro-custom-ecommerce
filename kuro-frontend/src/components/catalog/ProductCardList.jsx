import { addCartItem } from "../../store/cartStore";
import { ShoppingCart, ChevronRight } from "lucide-react";

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

export default function ProductCardList({ producto }) {
  const image = producto.image || MOCKUPS[producto.category] || "/mockups/playera.png";
  const description = (producto.description || "Sin descripción disponible").trim();

  return (
    <div
      onClick={() => (window.location.href = `/producto/${producto.slug}`)}
      className="group bg-[#161616] rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border border-[#2d2d2d] hover:border-[#555555] overflow-hidden cursor-pointer flex items-stretch gap-0"
    >
      <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 bg-[#1f1f1f] overflow-hidden relative flex items-center justify-center border-r border-[#2d2d2d]">
        <img
          src={image}
          alt={producto.name || "Producto"}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col justify-center px-4 py-4 flex-1 min-w-0">
        <p className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 font-bold">
          {getCategoryLabel(producto.category)}
        </p>
        <h3 className="text-sm font-bold text-[#f0f0f0] leading-snug tracking-wide uppercase">{producto.name || "Producto"}</h3>
        <p
          className="text-xs text-[#888888] mt-2 font-light leading-relaxed hidden sm:block"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
        <p className="text-[#f0f0f0] font-light mt-3 text-lg">${Number(producto.price || 0).toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 pr-4 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addCartItem(producto);
          }}
          title="Añadir a la bóveda"
          className="bg-[#2d2d2d] text-[#888888] rounded-sm hover:bg-[#f0f0f0] hover:text-[#0e0e0e] transition-all duration-200 w-9 h-9 flex items-center justify-center"
        >
          <ShoppingCart size={15} strokeWidth={1.5} />
        </button>
        <ChevronRight size={18} strokeWidth={1.5} className="text-[#555555] group-hover:text-[#f0f0f0] transition-colors" />
      </div>
    </div>
  );
}
