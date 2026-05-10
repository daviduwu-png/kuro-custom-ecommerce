import React from "react";
import { MapPin } from "lucide-react";


interface ParsedAddress {
    full_name?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    phone?: string;
}

interface ShippingAddressSectionProps {
    parsed?: ParsedAddress;
    raw?: string;
}

export default function ShippingAddressSection({ parsed, raw }: ShippingAddressSectionProps) {
    const hasParsed = parsed && (parsed.street || parsed.city || parsed.full_name);

    if (!hasParsed && !raw) return null;

    return (
        <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin size={15} /> Dirección de Envío
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                {hasParsed ? (
                    <>
                        {parsed!.full_name && (
                            <p className="font-bold text-gray-800">{parsed!.full_name}</p>
                        )}
                        {parsed!.street && <p>{parsed!.street}</p>}
                        {parsed!.neighborhood && <p>Col. {parsed!.neighborhood}</p>}
                        {(parsed!.city || parsed!.state) && (
                            <p>
                                {parsed!.city}
                                {parsed!.city && parsed!.state ? ", " : ""}
                                {parsed!.state}
                                {parsed!.postal_code ? ` ${parsed!.postal_code}` : ""}
                            </p>
                        )}
                        {parsed!.phone && (
                            <p className="text-gray-500 flex items-center gap-1 mt-1">
                                📞 {parsed!.phone}
                            </p>
                        )}
                    </>
                ) : (
                    raw!.split("\n").map((line, i) => (
                        <p key={i} className={i === 0 ? "font-bold text-gray-800" : ""}>
                            {line}
                        </p>
                    ))
                )}
            </div>
        </section>
    );
}
