const getCategoryLabel = (category) => {
  if (!category) return "Producto";
  return category;
};

export default function FeaturedProductCard({
  image,
  price,
  description,
  title,
  category,
  badge,
  href,
  basisClass,
  slideStyle,
}) {
  return (
    <a
      data-slide
      href={href}
      style={slideStyle}
      className={`group relative bg-[#161616] border border-[#2d2d2d] hover:border-[#555555] transition-all duration-300 overflow-hidden cursor-pointer flex flex-col shrink-0 min-w-0 snap-start rounded-sm ${basisClass}`}
    >
      <div className="aspect-square overflow-hidden bg-[#1f1f1f] relative">
        {badge && (
          <span className="absolute top-3 left-3 z-10 bg-[#f0f0f0] text-[#0e0e0e] text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-sm">
            {badge}
          </span>
        )}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden lg:block bg-gradient-to-t from-[#0e0e0e] to-transparent">
          <div className="w-full bg-[#f0f0f0] text-[#0e0e0e] text-sm font-bold py-3 rounded-sm shadow-lg hover:bg-white flex items-center justify-center gap-2 transition-colors">
            <span className="tracking-widest uppercase text-xs">Examinar</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-[#888888] uppercase tracking-widest mb-2 font-light">{getCategoryLabel(category)}</p>
        <h3
          className="text-base font-medium text-[#f0f0f0] leading-snug min-h-[3rem]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title || "Producto"}
        </h3>
        <p
          className="text-xs text-[#555555] font-light leading-relaxed mt-2 min-h-[2.5rem]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#2d2d2d]">
          <span className="text-lg font-light text-[#f0f0f0] tracking-wide">{price}</span>
        </div>
      </div>
    </a>
  );
}
