import { Upload } from "lucide-react";

export default function DesignUploader({ logo, scale, step, fileInputRef, onFileChange, onScaleChange }) {
  return (
    <>
      <div className="mb-8">
        <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-3 block">
          {step}. Tu Diseño
        </label>

        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 border border-dashed border-[#555555] rounded-sm flex flex-col items-center justify-center text-[#888888] hover:border-[#f0f0f0] hover:text-[#f0f0f0] hover:bg-[#1f1f1f] transition-all gap-2 group"
        >
          <Upload size={20} strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform" />
          <span className="font-bold text-xs uppercase tracking-widest">{logo ? "Cambiar imagen" : "Subir archivo PNG"}</span>
        </button>

        <p className="text-[10px] text-[#555555] mt-3 font-light leading-relaxed uppercase tracking-wider">
          Nota: Incorporar gráficos personalizados suma un cargo base de $150 MXN.
        </p>

        {logo && <p className="text-[10px] text-[#f0f0f0] mt-2 font-bold uppercase tracking-widest flex items-center gap-1">✓ Gráfico cargado</p>}
      </div>

      {logo && (
        <div className="mb-8 animate-fade-in-up">
          <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-3 block">Escala del gráfico</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            className="w-full h-1 bg-[#2d2d2d] rounded-none appearance-none cursor-pointer accent-[#f0f0f0]"
          />
        </div>
      )}
    </>
  );
}
