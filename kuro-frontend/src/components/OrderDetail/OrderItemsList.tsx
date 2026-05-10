import React from "react";
import { Package } from "lucide-react";

interface OrderItem {
    id?: number;
    product_name?: string;
    product?: { name: string; image?: string };
    quantity: number;
    unit_price?: string | number;
    price?: string | number;
    subtotal?: string | number;
    image?: string;
}

function formatPrice(val: string | number | undefined): string {
    if (val === undefined || val === null) return "0.00";
    return parseFloat(String(val)).toFixed(2);
}

interface OrderItemsListProps {
    items: OrderItem[];
}

export default function OrderItemsList({ items }: OrderItemsListProps) {
    return (
        <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package size={15} /> Artículos ({items.length})
            </h3>

            {items.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay artículos registrados en este pedido.</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item, idx) => {
                        const name = item.product_name ?? item.product?.name ?? `Artículo #${idx + 1}`;
                        const unitPrice = parseFloat(String(item.unit_price ?? item.price ?? 0));
                        const itemSubtotal = parseFloat(
                            formatPrice(item.subtotal ?? unitPrice * item.quantity)
                        );
                        const img = item.image ?? item.product?.image;

                        return (
                            <div
                                key={item.id ?? idx}
                                className="flex items-center gap-4 bg-gray-50 rounded-xl p-3"
                            >
                                {img ? (
                                    <img
                                        src={img}
                                        alt={name}
                                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-14 h-14 bg-indigo-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-200">
                                        <Package size={24} className="text-indigo-300" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {item.quantity} × ${unitPrice.toFixed(2)} MXN
                                    </p>
                                </div>
                                <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                                    ${itemSubtotal.toFixed(2)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
