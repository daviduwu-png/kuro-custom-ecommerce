import { ShoppingBag, RotateCcw, Loader2 } from "lucide-react";
import ColorPicker from "./ColorPicker";
import SizePicker from "./SizePicker";
import DesignUploader from "./DesignUploader";

export default function CustomizerPanel({
  productoActual,
  color,
  logo,
  scale,
  tallaId,
  adding,
  fileInputRef,
  onColorChange,
  onTallaChange,
  onFileChange,
  onScaleChange,
  onAgregar,
  onReset,
}) {
  const tieneVariantes = productoActual?.variants?.length > 0;

  const stepDiseño = tieneVariantes ? 3 : 2;

  const puedeAgregar = !adding && !!productoActual && !!logo && !(tieneVariantes && !tallaId);

  return (
    <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 h-fit bg-[#161616] p-6 rounded-sm shadow-xl border border-[#2d2d2d] sticky top-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-6">
        <h2 className="text-xl font-bold text-[#f0f0f0] uppercase tracking-widest">Personalizar</h2>
        <div className="rounded-sm border border-[#2d2d2d] bg-[#0e0e0e] px-4 sm:px-3 py-3 sm:py-2 flex flex-row sm:flex-col justify-between items-center sm:items-end shadow-sm w-full sm:w-auto sm:min-w-[10.5rem]">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Precio base</p>
            <p className="text-xl sm:text-2xl font-light text-[#f0f0f0] leading-none mt-1">${productoActual?.price}</p>
          </div>
          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mt-0 sm:mt-1 bg-[#1f1f1f] sm:bg-transparent px-2 py-1 sm:p-0 rounded-sm sm:rounded-none">+ $150 Diseño</p>
        </div>
      </div>

      <ColorPicker colorActual={color} onChange={onColorChange} />

      <SizePicker variantes={productoActual?.variants} tallaIdActual={tallaId} step={2} onSelect={onTallaChange} />

      <DesignUploader
        logo={logo}
        scale={scale}
        step={stepDiseño}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        onScaleChange={onScaleChange}
      />

      <div className="border-t border-[#2d2d2d] pt-6 mt-4 space-y-3">
        <button
          onClick={onAgregar}
          disabled={!puedeAgregar}
          className="w-full bg-[#f0f0f0] text-[#0e0e0e] py-4 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {adding ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <ShoppingBag size={18} strokeWidth={1.5} />}
          Agregar a Bóveda
        </button>

        <button
          onClick={onReset}
          className="w-full py-2 text-[#888888] hover:text-[#f0f0f0] text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2"
        >
          <RotateCcw size={14} strokeWidth={1.5} /> Reiniciar
        </button>
      </div>
    </div>
  );
}
