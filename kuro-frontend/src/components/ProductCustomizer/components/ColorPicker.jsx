import { COLORES } from "../utils/mockupUtils.jsx";

export default function ColorPicker({ colorActual, onChange }) {
  return (
    <div className="mb-8">
      <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-3 block">
        1. Tono Base
      </label>
      <div className="flex flex-wrap gap-3">
        {COLORES.map((c) => (
          <button
            key={c.hex}
            title={c.nombre}
            onClick={() => onChange(c.hex)}
            className={`w-8 h-8 rounded-sm border border-[#2d2d2d] transition-all ${
              colorActual === c.hex
                ? "ring-1 ring-offset-2 ring-offset-[#161616] ring-[#f0f0f0] border-[#f0f0f0]"
                : "hover:border-[#555555]"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}
