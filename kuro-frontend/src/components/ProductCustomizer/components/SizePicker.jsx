export default function SizePicker({ variantes, tallaIdActual, step, onSelect }) {
  if (!variantes || variantes.length === 0) return null;

  const varianteActiva = variantes.find((v) => v.id === tallaIdActual);

  return (
    <div className="mb-8 animate-fade-in-up">
      <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-3 block">
        {step}. Dimensión
      </label>

      <div className="flex flex-wrap gap-2">
        {variantes.map((v) => (
          <button
            key={v.id}
            disabled={v.stock <= 0}
            onClick={() => onSelect(v.id)}
            className={`px-4 py-2 font-bold text-xs uppercase tracking-widest rounded-sm transition-colors border ${
              v.stock <= 0
                ? "bg-[#0e0e0e] border-[#2d2d2d] text-[#555555] cursor-not-allowed line-through"
                : tallaIdActual === v.id
                  ? "bg-[#f0f0f0] border-[#f0f0f0] text-[#0e0e0e] shadow-md"
                  : "bg-[#1f1f1f] border-[#2d2d2d] text-[#888888] hover:border-[#555555] hover:text-[#f0f0f0]"
            }`}
          >
            {v.size === "UNI" ? "Unitalla" : v.size}
          </button>
        ))}
      </div>

      {tallaIdActual && varianteActiva && varianteActiva.stock <= 5 && (
        <p className="text-[10px] uppercase tracking-widest text-[#888888] mt-3 font-medium">
          Advertencia: <span className="text-[#f0f0f0]">Quedan {varianteActiva.stock} uds.</span>
        </p>
      )}
    </div>
  );
}
