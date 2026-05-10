import React from "react";
import { CheckCircle, Clock, AlertTriangle, X } from "lucide-react";

export type PaymentBannerState = {
    type: "success" | "pending" | "failed";
    orderId?: string;
};

interface PaymentBannerProps {
    banner: PaymentBannerState;
    onDismiss: () => void;
}

export default function PaymentBanner({ banner, onDismiss }: PaymentBannerProps) {
    if (banner.type === "success") {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-sm px-5 py-4 flex items-center gap-4 shadow-sm mb-6">
                <CheckCircle size={20} strokeWidth={2} className="text-green-500 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-bold text-green-400 uppercase tracking-widest text-[10px] mb-1">¡Pago recibido exitosamente!</p>
                    {banner.orderId && (
                        <p className="text-[10px] uppercase tracking-wider text-green-500/70 font-bold">
                            Orden #ORD-{String(banner.orderId).padStart(3, "0")} · Recibirás un correo de confirmación pronto.
                        </p>
                    )}
                </div>
                <button onClick={onDismiss} className="text-green-500/50 hover:text-green-400 transition-colors">
                    <X size={16} strokeWidth={2} />
                </button>
            </div>
        );
    }

    if (banner.type === "pending") {
        return (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm px-5 py-4 flex items-center gap-4 shadow-sm mb-6">
                <Clock size={20} strokeWidth={2} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-bold text-amber-400 uppercase tracking-widest text-[10px] mb-1">Pago en proceso</p>
                    {banner.orderId && (
                        <p className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold">
                            Orden #ORD-{String(banner.orderId).padStart(3, "0")} · Tu pago está siendo procesado. Te avisaremos cuando se acredite.
                        </p>
                    )}
                </div>
                <button onClick={onDismiss} className="text-amber-500/50 hover:text-amber-400 transition-colors">
                    <X size={16} strokeWidth={2} />
                </button>
            </div>
        );
    }

    // "failed"
    return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-5 py-4 flex items-center gap-4 shadow-sm mb-6">
            <AlertTriangle size={20} strokeWidth={2} className="text-red-500 flex-shrink-0" />
            <div className="flex-1">
                <p className="font-bold text-red-400 uppercase tracking-widest text-[10px] mb-1">El pago fue rechazado</p>
                {banner.orderId && (
                    <p className="text-[10px] uppercase tracking-wider text-red-500/70 font-bold">
                        No se realizó ningún cargo. Puedes intentarlo de nuevo.
                    </p>
                )}
            </div>
            <button onClick={onDismiss} className="text-red-500/50 hover:text-red-400 transition-colors">
                <X size={16} strokeWidth={2} />
            </button>
        </div>
    );
}
