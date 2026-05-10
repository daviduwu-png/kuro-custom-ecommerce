import { useState, useEffect, useMemo, useRef } from "react";
import { productService } from "../services/productService";
import FeaturedProductCard from "./FeaturedProductCard";

const MOCKUPS = {
  playeras: "/mockups/playera.png",
  sudaderas: "/mockups/sudadera.png",
  gorras: "/mockups/gorra.png",
  tazas: "/mockups/taza.png",
  shorts_box: "/mockups/shorts-box.png",
};

const CATEGORY_LABELS = {
  playeras: "Playeras",
  sudaderas: "Sudaderas",
  gorras: "Gorras",
  tazas: "Tazas",
  shorts_box: "Shorts box",
};

const getCategoryLabel = (category) => {
  if (!category) return "Producto";
  return CATEGORY_LABELS[category] || category.replaceAll("_", " ");
};

const formatPrice = (price) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
};

function SkeletonCard({ basisClass, slideStyle }) {
  return (
    <a
      data-slide
      style={slideStyle}
      className={`group relative bg-[#161616] rounded-sm shadow-sm border border-[#2d2d2d] overflow-hidden animate-pulse flex flex-col shrink-0 min-w-0 snap-start select-none ${basisClass}`}
    >
      <div className="aspect-square overflow-hidden bg-[#1f1f1f] relative">
        <span className="absolute top-2 left-2 z-10 bg-[#2d2d2d] text-transparent text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
          SKELETON T
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-transparent bg-[#2d2d2d] max-w-[33%] uppercase tracking-wider mb-1">CATEGORIA</p>
        <h3
          className="text-lg font-bold text-transparent bg-[#2d2d2d] max-w-[66%] leading-snug min-h-[3.25rem]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            color: "transparent",
          }}
        >
          Producto
        </h3>
        <p
          className="text-sm text-transparent bg-[#2d2d2d] leading-relaxed mt-1 min-h-[2.5rem]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            color: "transparent",
          }}
        >
          Sin descripcion disponible
        </p>
        <div className="flex items-center justify-between mt-auto pt-4">
          <span className="text-xl font-bold text-transparent bg-[#2d2d2d] min-w-[25%]">$00.00</span>
        </div>
      </div>
    </a>
  );
}

export default function FeaturedProducts({ variant = "featured", limit = 8, autoPlayMs = 4500 }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const sliderRef = useRef(null);
  const isHero = variant === "hero";
  const isNewArrivals = variant === "new-arrivals";
  const badgeText = isHero ? "Destacados" : isNewArrivals ? "Recien agregados" : "Mas vendido";

  const heroSlideStyle = useMemo(() => {
    if (!isHero) return undefined;
    return {
      flex: "0 0 clamp(11rem, 18vw, 14rem)",
    };
  }, [isHero]);

  let basisClass;
  if (isHero) {
    basisClass = "basis-[50%] sm:basis-[33%] md:basis-[26%] lg:basis-[21%] xl:basis-[18%]";
  } else if (isNewArrivals) {
    basisClass = "basis-[42%] sm:basis-[28%] md:basis-[22%] lg:basis-[18%] xl:basis-[15%]";
  } else {
    basisClass = "basis-[58%] sm:basis-[48%] lg:basis-[31%] xl:basis-[24%]";
  }

  const maxIndicators = 6;
  const visibleIndicators = useMemo(() => {
    if (productos.length <= maxIndicators) return productos.length;
    return maxIndicators;
  }, [productos.length]);

  useEffect(() => {
    productService.getAllProducts().then((data) => {
      const productList = Array.isArray(data) ? data : [];
      const sortedProducts = [...productList];

      if (isNewArrivals) {
        sortedProducts.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      }

      setProductos(sortedProducts.slice(0, limit));
      setCargando(false);
    });
  }, [isNewArrivals, limit]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;

    const updateCurrentSlide = () => {
      const firstCard = slider.querySelector("[data-slide]");
      if (!firstCard) return;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const computedStyle = window.getComputedStyle(slider);
      const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || "0") || 0;
      const step = cardWidth + gap;
      if (!step) return;

      const index = Math.round(slider.scrollLeft / step);
      setCurrentIndex(Math.max(0, Math.min(index, productos.length - 1)));
    };

    updateCurrentSlide();
    slider.addEventListener("scroll", updateCurrentSlide, { passive: true });
    window.addEventListener("resize", updateCurrentSlide);

    return () => {
      slider.removeEventListener("scroll", updateCurrentSlide);
      window.removeEventListener("resize", updateCurrentSlide);
    };
  }, [productos.length]);

  const scrollToIndex = (index) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const firstCard = slider.querySelector("[data-slide]");
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(slider);
    const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || "0") || 0;
    const step = cardWidth + gap;

    slider.scrollTo({
      left: step * index,
      behavior: "smooth",
    });
  };

  const prevSlide = () => {
    scrollToIndex(Math.max(currentIndex - 1, 0));
  };

  const nextSlide = () => {
    scrollToIndex(Math.min(currentIndex + 1, productos.length - 1));
  };

  useEffect(() => {
    if (productos.length <= 1 || isAutoPlayPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previousIndex) => {
        const nextIndex = previousIndex >= productos.length - 1 ? 0 : previousIndex + 1;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, autoPlayMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [productos.length, isAutoPlayPaused, autoPlayMs]);

  if (!isHero && !isNewArrivals) {
    if (cargando) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#161616] rounded-sm shadow-sm border border-[#2d2d2d] overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-[#1f1f1f]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-[#2d2d2d] w-1/3" />
                <div className="h-5 bg-[#2d2d2d] w-2/3" />
                <div className="h-5 bg-[#2d2d2d] w-1/4" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (productos.length === 0) return null;
  }

  if (!cargando && productos.length === 0) {
    if (isHero) return <div className="h-[18rem] sm:h-[19rem] md:h-[21rem]" aria-hidden="true" />;
    return null;
  }

  const skeletonCount = 6;

  return (
    <div className="relative">
      {!isHero && <></>}

      <div
        ref={sliderRef}
        className={`flex ${isHero ? "gap-3" : "gap-3 md:gap-6"} overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-1 md:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
        onTouchStart={() => setIsAutoPlayPaused(true)}
        onTouchEnd={() => setIsAutoPlayPaused(false)}
      >
        {cargando
          ? [...Array(skeletonCount)].map((_, i) => (
              <SkeletonCard key={`sk-${i}`} basisClass={basisClass} slideStyle={heroSlideStyle} />
            ))
          : productos.map((producto) => {
              const imagen = producto.image || MOCKUPS[producto.category] || "/mockups/playera.png";
              const description = (producto.description || "Sin descripcion disponible").trim();
              const hasSlug = Boolean(producto.slug);
              const title = producto.name || "Producto";
              const category = getCategoryLabel(producto.category);
              const href = hasSlug ? `/producto/${producto.slug}` : "/catalogo";

              return (
                <FeaturedProductCard
                  key={producto.id}
                  image={imagen}
                  price={formatPrice(producto.price)}
                  description={description}
                  title={title}
                  category={category}
                  badge={badgeText}
                  href={href}
                  basisClass={basisClass}
                  slideStyle={heroSlideStyle}
                />
              );
            })}
      </div>

      <div className={`mt-6 flex items-center justify-center ${isHero ? "" : "sm:justify-between"} gap-4`}>
        <div className="flex items-center gap-2">
          {cargando
            ? [...Array(skeletonCount)].map((_, i) => (
                <button
                  key={i}
                  disabled
                  className={`h-2.5 rounded-none bg-[#2d2d2d] animate-pulse ${i === 0 ? "w-8" : "w-2.5"}`}
                />
              ))
            : Array.from({ length: visibleIndicators }).map((_, index) => {
                const targetIndex = Math.round(
                  (index * Math.max(productos.length - 1, 0)) / Math.max(visibleIndicators - 1, 1)
                );
                const isActive = currentIndex === targetIndex;

                return (
                  <button
                    key={`dot-${targetIndex}`}
                    type="button"
                    aria-label={`Ir al producto ${targetIndex + 1}`}
                    onClick={() => scrollToIndex(targetIndex)}
                    className={`h-2 transition-all rounded-sm ${
                      isActive ? "w-8 bg-[#f0f0f0]" : "w-2 bg-[#2d2d2d] hover:bg-[#555555]"
                    }`}
                  />
                );
              })}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {cargando ? (
            <>
              <button disabled className="h-10 w-10 rounded-sm bg-[#2d2d2d] animate-pulse border border-transparent" />
              <button disabled className="h-10 w-10 rounded-sm bg-[#2d2d2d] animate-pulse border border-transparent" />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Producto anterior"
                className="h-10 w-10 flex items-center justify-center rounded-sm border border-[#2d2d2d] bg-[#161616] text-[#f0f0f0] hover:bg-[#1f1f1f] hover:border-[#555555] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={currentIndex === 0}
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Siguiente producto"
                className="h-10 w-10 flex items-center justify-center rounded-sm border border-[#2d2d2d] bg-[#161616] text-[#f0f0f0] hover:bg-[#1f1f1f] hover:border-[#555555] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={currentIndex >= productos.length - 1}
              >
                &gt;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
