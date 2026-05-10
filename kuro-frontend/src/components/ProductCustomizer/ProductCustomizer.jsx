import { Shirt, Loader2 } from "lucide-react";
import { useCustomizer } from "./hooks/useCustomizer";
import { getMockupForCategory } from "./utils/mockupUtils.jsx";
import ProductSelector from "./components/ProductSelector";
import MockupCanvas from "./components/MockupCanvas";
import CustomizerPanel from "./components/CustomizerPanel";

export default function ProductCustomizer() {
  const {
    productosDisponibles,
    productoActual,
    loading,
    color,
    logo,
    scale,
    tallaId,
    adding,
    fileInputRef,
    draggableRef,
    setColor,
    setScale,
    setTallaId,
    setLogo,
    seleccionarProducto,
    handleImageUpload,
    resetEditor,
    handleAgregarAlCarrito,
  } = useCustomizer();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center text-[#555555] gap-4">
          <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-[#888888]" />
          <p className="font-bold text-xs uppercase tracking-widest animate-pulse">Inicializando módulo de diseño...</p>
        </div>
      </div>
    );
  }

  if (productosDisponibles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px] text-[#888888] p-8 text-center bg-[#161616] m-4 rounded-sm border border-[#2d2d2d]">
        <div>
          <Shirt size={48} strokeWidth={1} className="mx-auto mb-4 text-[#555555]" />
          <h2 className="text-xl font-bold text-[#f0f0f0] uppercase tracking-widest">Sin productos personalizables</h2>
          <p className="mt-4 text-xs font-light uppercase tracking-wide">
            El sistema aún no tiene modelos habilitados para la manipulación.
          </p>
        </div>
      </div>
    );
  }

  const mockupUI = getMockupForCategory(productoActual?.category);
  const showSelector = productosDisponibles.length > 1;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] py-4">
      <div className="flex-1 bg-[#161616] rounded-sm border border-[#2d2d2d] p-4 lg:p-10 flex flex-col lg:flex-row items-center relative shadow-sm overflow-hidden gap-4 lg:gap-8">
        <ProductSelector
          productos={productosDisponibles}
          productoActual={productoActual}
          onSelect={seleccionarProducto}
        />

        <div className="flex-1 w-full flex items-center justify-center">
          <MockupCanvas
            mockupImg={mockupUI.img}
            color={color}
            logo={logo}
            scale={scale}
            draggableRef={draggableRef}
            fileInputRef={fileInputRef}
            onRemoveLogo={() => setLogo(null)}
          />
        </div>
      </div>

      <CustomizerPanel
        productoActual={productoActual}
        color={color}
        logo={logo}
        scale={scale}
        tallaId={tallaId}
        adding={adding}
        fileInputRef={fileInputRef}
        onColorChange={setColor}
        onTallaChange={setTallaId}
        onFileChange={handleImageUpload}
        onScaleChange={setScale}
        onAgregar={handleAgregarAlCarrito}
        onReset={resetEditor}
      />
    </div>
  );
}
