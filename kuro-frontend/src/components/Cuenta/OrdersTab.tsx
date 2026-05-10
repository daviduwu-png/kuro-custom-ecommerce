import React from "react";
import {
    CheckCircle, CreditCard, Truck, Clock, XCircle,
    RefreshCcw, Loader2,
} from "lucide-react";

export type OrderStatus = "delivered" | "paid" | "shipped" | "pending" | "cancelled" | "failed" | string;

export function getStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        delivered: { label: "Entregado", cls: "bg-green-500/10 text-green-400 border border-green-500/20", icon: <CheckCircle size={10} strokeWidth={2} /> },
        paid:      { label: "Pagado",    cls: "bg-purple-500/10 text-purple-400 border border-purple-500/20", icon: <CreditCard size={10} strokeWidth={2} /> },
        shipped:   { label: "Enviado",   cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20", icon: <Truck size={10} strokeWidth={2} /> },
        pending:   { label: "Pendiente", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20", icon: <Clock size={10} strokeWidth={2} /> },
        cancelled: { label: "Cancelado", cls: "bg-red-500/10 text-red-400 border border-red-500/20", icon: <XCircle size={10} strokeWidth={2} /> },
        failed:    { label: "Fallido",   cls: "bg-red-500/10 text-red-400 border border-red-500/20", icon: <XCircle size={10} strokeWidth={2} /> },
    };
    const cfg = map[status] ?? {
        label: status || "Pendiente",
        cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        icon: <Clock size={10} strokeWidth={2} />,
    };
    return (
        <span className={`${cfg.cls} text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm font-bold flex items-center gap-1.5`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

interface OrdersTabProps {
    orders: any[];
    isAdmin: boolean;
    refundingId: number | null;
    onViewOrder: (order: any) => void;
    onRefund: (order: any) => void;
}

export default function OrdersTab({
    orders,
    isAdmin,
    refundingId,
    onViewOrder,
    onRefund,
}: OrdersTabProps) {
    return (
        <>
            <h2 className="text-xl font-bold text-[#f0f0f0] uppercase tracking-widest mb-6">Historial de Bóveda</h2>
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="bg-[#161616] border border-[#2d2d2d] rounded-sm p-8 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#555555]">Aún no tienes movimientos registrados.</p>
                    </div>
                ) : (
                    orders.map((order: any, idx: number) => (
                        <div
                            key={order.id || idx}
                            className="bg-[#161616] border border-[#2d2d2d] rounded-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#555555] transition-colors"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <span className="font-bold text-[#f0f0f0] tracking-wider">
                                        #ORD-{String(order.id).padStart(3, "0")}
                                    </span>
                                    {getStatusBadge(order.status)}
                                </div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-[#888888]">
                                    {new Date(order.created_at).toLocaleDateString("es-MX", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}{" "}
                                    <span className="mx-2 text-[#555555]">/</span> {order.items ? order.items.length : 0} ARTÍCULOS
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                                <p className="font-light text-[#f0f0f0] text-lg">
                                    ${parseFloat(order.total_amount || "0").toFixed(2)} MXN
                                </p>
                                <div className="flex gap-3 items-center flex-wrap justify-end w-full sm:w-auto">
                                    <button
                                        onClick={() => onViewOrder(order)}
                                        className="text-[#f0f0f0] text-[10px] font-bold uppercase tracking-widest hover:text-[#888888] flex items-center gap-1 border-b border-[#f0f0f0] hover:border-[#888888] pb-0.5 transition-colors"
                                    >
                                        Ver detalles
                                    </button>
                                    {isAdmin && order.status === "paid" && (
                                        <button
                                            onClick={() => onRefund(order)}
                                            disabled={refundingId === order.id}
                                            className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-sm font-bold transition-colors disabled:opacity-50 border border-red-500/20"
                                        >
                                            {refundingId === order.id ? (
                                                <Loader2 size={11} strokeWidth={2} className="animate-spin" />
                                            ) : (
                                                <RefreshCcw size={11} strokeWidth={2} />
                                            )}
                                            Reembolsar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
