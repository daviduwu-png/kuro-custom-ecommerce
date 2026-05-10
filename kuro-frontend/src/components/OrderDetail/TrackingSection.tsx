import React, { useState } from "react";
import { Truck, Copy, Check, ExternalLink, Package, Navigation, MapPin } from "lucide-react";

interface TrackingSectionProps {
  trackingNumber: string;
  trackingUrl?: string;
  shippingStatus?: string;
}

const SHIPPING_LABELS: Record<string, { text: string; bg: string; textCol: string; icon: any }> = {
  pending: {
    text: "Preparando envío",
    bg: "bg-gray-50 border border-gray-200",
    textCol: "text-gray-700",
    icon: Package,
  },
  label_created: {
    text: "Guía generada",
    bg: "bg-gray-50 border border-gray-200",
    textCol: "text-gray-700",
    icon: Package,
  },
  in_transit: {
    text: "En tránsito",
    bg: "bg-amber-50 border border-amber-200",
    textCol: "text-amber-700",
    icon: Navigation,
  },
  delivered: {
    text: "Entregado",
    bg: "bg-emerald-50 border border-emerald-200",
    textCol: "text-emerald-700",
    icon: MapPin,
  },
};

export default function TrackingSection({ trackingNumber, trackingUrl, shippingStatus }: TrackingSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusConfig = shippingStatus ? SHIPPING_LABELS[shippingStatus] : null;
  const StatusIcon = statusConfig?.icon;

  let finalTrackingUrl = trackingUrl;
  if (finalTrackingUrl && finalTrackingUrl.toLowerCase().includes(".pdf")) {
    finalTrackingUrl = `https://rastreo.skydropx.com/trackings/${trackingNumber}`;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Truck size={15} /> Rastreo del Envío
        </h3>
        {statusConfig && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.textCol}`}
          >
            <StatusIcon size={12} /> {statusConfig.text}
          </span>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Número de rastreo</p>
            <p className="font-bold text-gray-900 font-mono text-base break-all">{trackingNumber}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        {finalTrackingUrl ? (
          <a
            href={finalTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-white bg-gray-900 hover:bg-black px-4 py-2.5 rounded-lg transition-colors w-full"
          >
            <ExternalLink size={13} />
            Rastrear mi paquete
          </a>
        ) : (
          <p className="text-xs text-gray-500 italic">
            El enlace de rastreo estará disponible pronto o usa el número directamente con la paquetería.
          </p>
        )}
      </div>
    </section>
  );
}
