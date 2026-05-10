import { useState, useEffect } from "react";
import { Search, Frown, LayoutGrid, List } from "lucide-react";
import { productService } from "../services/productService";
import ProductCardGrid from "./catalog/ProductCardGrid";
import ProductCardList from "./catalog/ProductCardList";

const CATEGORY_LABELS = {
  todos: "Todos",
  shorts_box: "Shorts para box",
  "sin-categoria": "Sin categoría",
};

const getCategoryLabel = (category) => {
  const safe = category || "sin-categoria";
  return CATEGORY_LABELS[safe] || safe.replace(/_/g, " ");
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-[#161616] rounded-sm border border-[#2d2d2d] overflow-hidden animate-pulse">
          <div className="aspect-square bg-[#1f1f1f]" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-[#2d2d2d] rounded-sm w-1/3" />
            <div className="h-4 bg-[#2d2d2d] rounded-sm w-2/3" />
            <div className="h-5 bg-[#2d2d2d] rounded-sm w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-[#161616] rounded-sm border border-[#2d2d2d] overflow-hidden animate-pulse flex h-28">
          <div className="w-28 sm:w-36 bg-[#1f1f1f] shrink-0" />
          <div className="flex flex-col justify-center px-4 py-3 gap-2 flex-1">
            <div className="h-3 bg-[#2d2d2d] rounded-sm w-1/4" />
            <div className="h-5 bg-[#2d2d2d] rounded-sm w-1/2" />
            <div className="h-3 bg-[#2d2d2d] rounded-sm w-3/4 hidden sm:block" />
            <div className="h-5 bg-[#2d2d2d] rounded-sm w-1/5 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-[#161616] border border-[#2d2d2d] rounded-sm p-1">
      <button
        title="Vista en cuadrícula"
        onClick={() => onChange("grid")}
        className={`flex items-center justify-center w-9 h-9 rounded-sm transition-all duration-200 ${
          view === "grid" ? "bg-[#f0f0f0] text-[#0e0e0e]" : "text-[#888888] hover:text-[#f0f0f0]"
        }`}
      >
        <LayoutGrid size={18} strokeWidth={1.5} />
      </button>
      <button
        title="Vista en lista"
        onClick={() => onChange("list")}
        className={`flex items-center justify-center w-9 h-9 rounded-sm transition-all duration-200 ${
          view === "list" ? "bg-[#f0f0f0] text-[#0e0e0e]" : "text-[#888888] hover:text-[#f0f0f0]"
        }`}
      >
        <List size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default function ProductGrid() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todos");
  const [maxPrecio, setMaxPrecio] = useState(1000);
  const [tallaFiltro, setTallaFiltro] = useState("todas");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [maxPriceInDB, setMaxPriceInDB] = useState(1000);

  useEffect(() => {
    productService.getAllProducts().then((data) => {
      const prods = Array.isArray(data) ? data : [];
      setProductos(prods);
      if (prods.length > 0) {
        const mx = Math.max(...prods.map((p) => Number(p.price || 0)));
        const roundedMax = Math.ceil(mx / 50) * 50;
        setMaxPriceInDB(Math.max(roundedMax || 500, 500));
        setMaxPrecio(Math.max(roundedMax || 500, 500));
      }
      setCargando(false);
    });
  }, []);

  const productosFiltrados = productos.filter((p) => {
    const nombre = (p.name || "").toLowerCase();
    const categoria = p.category || "";

    let match = nombre.includes(busqueda.toLowerCase());
    if (categoriaActiva !== "todos" && categoria !== categoriaActiva) match = false;

    const pPrice = Number(p.price || 0);
    if (pPrice > maxPrecio) match = false;

    if (tallaFiltro !== "todas") {
      if (!p.variants || !p.variants.some((v) => v.size === tallaFiltro)) {
        match = false;
      }
    }

    return match;
  });

  const categorias = ["todos", ...new Set(productos.map((p) => p.category || "sin-categoria"))];
  const tallasDisponibles = [
    "todas",
    ...new Set(productos.flatMap((p) => p.variants?.map((v) => v.size) || []).filter(Boolean)),
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-sm capitalize text-xs tracking-widest uppercase font-bold transition-all duration-200 whitespace-nowrap shrink-0 border ${
                  categoriaActiva === cat
                    ? "bg-[#f0f0f0] text-[#0e0e0e] border-[#f0f0f0]"
                    : "bg-[#161616] text-[#888888] border-[#2d2d2d] hover:border-[#555555] hover:text-[#f0f0f0]"
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
          {(busqueda || categoriaActiva !== "todos" || maxPrecio !== maxPriceInDB || tallaFiltro !== "todas") && (
            <button
              onClick={() => {
                setBusqueda("");
                setCategoriaActiva("todos");
                setMaxPrecio(maxPriceInDB);
                setTallaFiltro("todas");
              }}
              className="text-[10px] font-bold text-[#888888] hover:text-[#f0f0f0] uppercase tracking-widest whitespace-nowrap hidden sm:block shrink-0 px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 bg-[#161616] p-5 rounded-sm border border-[#2d2d2d]">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex-1 w-full relative group">
              <input
                type="text"
                placeholder="BUSCAR PRODUCTO..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="peer w-full pl-11 pr-4 py-3 border border-[#2d2d2d] rounded-sm bg-[#1f1f1f] text-[#f0f0f0] focus:bg-[#1f1f1f] focus:outline-none focus:border-[#555555] transition-all text-xs tracking-widest placeholder-[#555555]"
              />
              <Search
                size={18}
                strokeWidth={1.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] peer-focus:text-[#f0f0f0] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 min-w-[220px]">
              <div className="flex justify-between items-center text-xs tracking-widest uppercase">
                <span className="text-[#888888] font-bold">Precio máximo:</span>
                <span className="font-bold text-[#f0f0f0]">${maxPrecio}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxPriceInDB}
                step="50"
                value={maxPrecio}
                onChange={(e) => setMaxPrecio(Number(e.target.value))}
                className="w-full h-1 bg-[#2d2d2d] rounded-none appearance-none cursor-pointer accent-[#f0f0f0]"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-[#2d2d2d]">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-center flex-1">
              <span className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mr-2 shrink-0">Talla:</span>
              {tallasDisponibles.map((t) => (
                <button
                  key={t}
                  onClick={() => setTallaFiltro(t)}
                  className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap shrink-0 border ${
                    tallaFiltro === t
                      ? "bg-[#f0f0f0] text-[#0e0e0e] border-[#f0f0f0]"
                      : "bg-[#1f1f1f] text-[#888888] border-[#2d2d2d] hover:border-[#555555] hover:text-[#f0f0f0]"
                  }`}
                >
                  {t === "todas" ? "Todas" : t === "UNI" ? "UNI" : t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 hidden md:flex shrink-0">
              {!cargando && (
                <span className="text-[10px] text-[#888888] font-bold tracking-widest uppercase bg-[#1f1f1f] border border-[#2d2d2d] px-3 py-1.5 rounded-sm">
                  {productosFiltrados.length} {productosFiltrados.length === 1 ? "resultado" : "resultados"}
                </span>
              )}
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          <div className="flex justify-between items-center md:hidden pt-2 border-t border-[#2d2d2d] mt-2">
            <div className="flex items-center gap-3">
              {!cargando && (
                <span className="text-[10px] text-[#888888] font-bold uppercase tracking-widest">
                  {productosFiltrados.length} result
                </span>
              )}
              {(busqueda || categoriaActiva !== "todos" || maxPrecio !== maxPriceInDB || tallaFiltro !== "todas") && (
                <button
                  onClick={() => {
                    setBusqueda("");
                    setCategoriaActiva("todos");
                    setMaxPrecio(maxPriceInDB);
                    setTallaFiltro("todas");
                  }}
                  className="text-[10px] font-bold text-[#555555] hover:text-[#f0f0f0] uppercase tracking-widest whitespace-nowrap"
                >
                  Limpiar
                </button>
              )}
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {cargando && (view === "grid" ? <SkeletonGrid /> : <SkeletonList />)}

      {!cargando && productosFiltrados.length === 0 && (
        <div className="text-center py-24 border border-[#2d2d2d] bg-[#161616] rounded-sm">
          <div className="inline-flex bg-[#1f1f1f] p-5 rounded-full mb-4 border border-[#2d2d2d]">
            <Frown size={44} strokeWidth={1} className="text-[#555555]" />
          </div>
          <p className="text-xl text-[#f0f0f0] font-bold uppercase tracking-widest">Sin resultados</p>
          <p className="text-sm text-[#888888] mt-2 font-light">Modifica los parámetros de búsqueda.</p>
          <button
            onClick={() => {
              setBusqueda("");
              setCategoriaActiva("todos");
              setMaxPrecio(maxPriceInDB);
              setTallaFiltro("todas");
            }}
            className="mt-5 text-[#f0f0f0] text-xs font-bold uppercase tracking-widest hover:text-[#888888] transition-colors border-b border-[#f0f0f0] hover:border-[#888888] pb-1"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {!cargando && productosFiltrados.length > 0 && view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {productosFiltrados.map((producto) => (
            <ProductCardGrid key={producto.id} producto={producto} />
          ))}
        </div>
      )}

      {!cargando && productosFiltrados.length > 0 && view === "list" && (
        <div className="flex flex-col gap-3">
          {productosFiltrados.map((producto) => (
            <ProductCardList key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}
