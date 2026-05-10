import Draggable from "react-draggable";
import { X } from "lucide-react";

export default function MockupCanvas({ mockupImg, color, logo, scale, draggableRef, fileInputRef, onRemoveLogo }) {
  return (
    <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center select-none bg-[#e0e0e0] rounded-sm border border-[#cccccc] my-auto p-6 shadow-inner">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={mockupImg}
          alt="Base del producto"
          className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none drop-shadow-lg opacity-90"
        />

        <div
          className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply transition-colors duration-300"
          style={{
            backgroundColor: color,
            maskImage: `url(${mockupImg})`,
            WebkitMaskImage: `url(${mockupImg})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />

        <div className="absolute inset-0 z-30 overflow-hidden flex items-center justify-center">
          {logo ? (
            <Draggable nodeRef={draggableRef}>
              <div ref={draggableRef} className="cursor-move relative group inline-block">
                <img
                  src={logo}
                  alt="Diseño personalizado"
                  style={{ transform: `scale(${scale})` }}
                  className="max-w-[200px] pointer-events-none drop-shadow-md"
                />
                <button
                  onClick={() => {
                    onRemoveLogo();
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-4 -right-4 bg-[#f0f0f0] text-[#0e0e0e] p-1 rounded-sm opacity-0 group-hover:opacity-100 transition shadow-lg hover:scale-110 z-50"
                  title="Remover gráfico"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </Draggable>
          ) : (
            <div className="pointer-events-none opacity-50 border border-[#888888] border-dashed p-4 rounded-sm bg-[#cccccc]/50 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Área de impresión</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
