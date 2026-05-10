import React, { useEffect, useRef } from "react";
import { X, CheckCircle, CreditCard, Truck, Clock, ShoppingBag, Calendar } from "lucide-react";
import OrderItemsList from "./OrderDetail/OrderItemsList";
import ShippingAddressSection from "./OrderDetail/ShippingAddressSection";
import TrackingSection from "./OrderDetail/TrackingSection";
import PaymentInfoSection from "./OrderDetail/PaymentInfoSection";
import OrderSummarySection from "./OrderDetail/OrderSummarySection";

interface OrderItem {
    id: number;
    product_name?: string;
    product?: { name: string; image?: string };
    quantity: number;
    unit_price?: string | number;
    price?: string | number;
    subtotal?: string | number;
    image?: string;
}

interface ParsedAddress {
    full_name?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    phone?: string;
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    updated_at?: string;
    total_amount: string | number;
    subtotal?: string | number;
    shipping_cost?: string | number;
    items?: OrderItem[];
    shipping_address?: string; 
    shipping_address_parsed?: ParsedAddress; 
    payment_method?: string;
    card_brand?: string;
    card_last4?: string;
    notes?: string;
    tracking_number?: string;
    tracking_url?: string;
}

interface OrderDetailModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    delivered: { label: "Entregado", color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle size={14} /> },
    Entregado: { label: "Entregado", color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle size={14} /> },
    paid: { label: "Pagado", color: "text-violet-700", bg: "bg-violet-100", icon: <CreditCard size={14} /> },
    Pagado: { label: "Pagado", color: "text-violet-700", bg: "bg-violet-100", icon: <CreditCard size={14} /> },
    shipped: { label: "Enviado", color: "text-blue-700", bg: "bg-blue-100", icon: <Truck size={14} /> },
    Enviado: { label: "Enviado", color: "text-blue-700", bg: "bg-blue-100", icon: <Truck size={14} /> },
    pending: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-100", icon: <Clock size={14} /> },
    Pendiente: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-100", icon: <Clock size={14} /> },
};

function getStatusConfig(status: string) {
    return (
        STATUS_CONFIG[status] ?? {
            label: status || "Pendiente",
            color: "text-amber-700",
            bg: "bg-amber-100",
            icon: <Clock size={14} />,
        }
    );
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);

    // Cerrar al presionar Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen || !order) return null;

    const statusCfg = getStatusConfig(order.status);
    const items = order.items ?? [];

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose();
    };

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                style={{ animation: "order-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl">
                            <ShoppingBag size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg leading-tight">
                                Pedido{" "}
                                <span className="text-indigo-600">
                                    #ORD-{String(order.id).padStart(3, "0")}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={11} />
                                {new Date(order.created_at).toLocaleDateString("es-MX", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}
                        >
                            {statusCfg.icon}
                            {statusCfg.label}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    <OrderItemsList items={items} />

                    <ShippingAddressSection 
                        parsed={order.shipping_address_parsed} 
                        raw={order.shipping_address} 
                    />

                    {order.tracking_number && (
                        <TrackingSection 
                            trackingNumber={order.tracking_number} 
                            trackingUrl={order.tracking_url} 
                        />
                    )}

                    <PaymentInfoSection 
                        paymentMethod={order.payment_method}
                        cardBrand={order.card_brand}
                        cardLast4={order.card_last4}
                        notes={order.notes}
                    />

                    <OrderSummarySection 
                        items={items}
                        subtotal={order.subtotal}
                        shippingCost={order.shipping_cost}
                        totalAmount={order.total_amount}
                    />
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes order-modal-in {
                    from { opacity: 0; transform: scale(0.92) translateY(16px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
