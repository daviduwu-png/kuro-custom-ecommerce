import React from "react";

function formatPrice(val: string | number | undefined): string {
  if (val === undefined || val === null) return "0.00";
  return parseFloat(String(val)).toFixed(2);
}

interface OrderItem {
  subtotal?: string | number;
  unit_price?: string | number;
  price?: string | number;
  quantity: number;
}

interface OrderSummarySectionProps {
  items: OrderItem[];
  subtotal?: string | number;
  shippingCost?: string | number;
  totalAmount: string | number;
}

export default function OrderSummarySection({ items, subtotal, shippingCost, totalAmount }: OrderSummarySectionProps) {
  const computedSubtotal = subtotal
    ? formatPrice(subtotal)
    : formatPrice(
        items.reduce((acc, item) => {
          const unitPrice = parseFloat(String(item.unit_price ?? item.price ?? 0));
          return acc + parseFloat(formatPrice(item.subtotal ?? unitPrice * item.quantity));
        }, 0)
      );

  const computedShippingCost =
    shippingCost !== undefined && shippingCost !== null
      ? parseFloat(String(shippingCost))
      : Math.max(0, parseFloat(String(totalAmount)) - parseFloat(computedSubtotal));

  const formattedShipping = formatPrice(computedShippingCost);

  return (
    <section>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Resumen</h3>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${computedSubtotal} MXN</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Envío</span>
          <span>
            {parseFloat(formattedShipping) === 0 ? (
              <span className="text-emerald-600 font-medium">Gratis</span>
            ) : (
              `$${formattedShipping} MXN`
            )}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span>${formatPrice(totalAmount)} MXN</span>
        </div>
      </div>
    </section>
  );
}
