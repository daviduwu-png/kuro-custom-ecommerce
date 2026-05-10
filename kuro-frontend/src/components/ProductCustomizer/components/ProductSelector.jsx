import { getCategoryLabel, getMockupForCategory } from "../utils/mockupUtils.jsx";

export default function ProductSelector({ productos, productoActual, onSelect }) {
  if (productos.length <= 1) return null;

  return (
    <div className="z-40 flex flex-row lg:flex-col gap-3 sm:gap-4 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] w-full lg:w-[124px] lg:pr-4 pb-4 lg:pb-2 pt-1 lg:pt-2 mb-4 lg:mb-0 max-w-full shrink-0">
      {productos.map((prod) => {
        const { img, icon } = getMockupForCategory(prod.category);
        const isSelected = productoActual?.id === prod.id;
        const previewImg = img || prod.image;
        const productLabel = prod.name || getCategoryLabel(prod.category);
        const categoryLabel = getCategoryLabel(prod.category);

        return (
          <div key={prod.id} className="shrink-0 w-[88px] sm:w-[96px]">
            <button
              onClick={() => onSelect(prod)}
              title={productLabel}
              className={`relative mx-auto rounded-sm border overflow-hidden bg-[#1f1f1f] transition-all duration-200 flex items-center justify-center ${
                isSelected
                  ? "w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] border-[#f0f0f0]"
                  : "w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] border-[#2d2d2d] hover:border-[#555555]"
              }`}
            >
              <img
                src={previewImg}
                alt={productLabel}
                className={`w-full h-full object-contain transition-all duration-200 ${isSelected ? "p-2.5 opacity-100" : "p-3 opacity-60"}`}
              />

              <span className={`absolute bottom-1 right-1 ${isSelected ? "text-[#f0f0f0]" : "text-[#555555]"}`}>
                {icon}
              </span>
              {isSelected && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
            </button>

            <p className="mt-2 text-[10px] uppercase font-bold tracking-widest leading-tight text-center text-[#f0f0f0] truncate" title={productLabel}>
              {productLabel}
            </p>
            <p className="text-[10px] font-light uppercase tracking-widest leading-tight text-center text-[#555555] truncate" title={categoryLabel}>
              {categoryLabel}
            </p>
          </div>
        );
      })}
    </div>
  );
}
