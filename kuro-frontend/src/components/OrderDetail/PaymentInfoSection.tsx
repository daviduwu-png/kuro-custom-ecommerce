import React from "react";
import { CreditCard, Hash } from "lucide-react";

interface PaymentInfoSectionProps {
    paymentMethod?: string;
    cardBrand?: string;
    cardLast4?: string;
    notes?: string;
}

export default function PaymentInfoSection({
    paymentMethod,
    cardBrand,
    cardLast4,
    notes,
}: PaymentInfoSectionProps) {
    if (!paymentMethod && !notes) return null;

    const paymentLabel =
        paymentMethod === "stripe"
            ? "Stripe (Tarjeta)"
            : paymentMethod === "mercadopago"
            ? "Mercado Pago"
            : paymentMethod;

    return (
        <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CreditCard size={15} /> Pago
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
                {paymentMethod && (
                    <div className="flex items-center gap-2">
                        <Hash size={13} className="text-gray-400" />
                        <span className="text-gray-500">Método:</span>
                        <span className="font-medium">{paymentLabel}</span>
                    </div>
                )}
                {/* Info de tarjeta Stripe */}
                {cardBrand && cardLast4 && (
                    <div className="flex items-center gap-2">
                        <Hash size={13} className="text-gray-400" />
                        <span className="text-gray-500">Tarjeta:</span>
                        <span className="font-medium capitalize">
                            {cardBrand} •••• {cardLast4}
                        </span>
                    </div>
                )}
                {notes && (
                    <p className="text-gray-500 italic text-xs mt-1">Nota: {notes}</p>
                )}
            </div>
        </section>
    );
}
