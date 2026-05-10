import React from "react";
import { MapPin } from "lucide-react";

interface AddressesTabProps {
    addresses: any[];
    onAddNew: () => void;
    onEdit: (address: any) => void;
    onDelete: (id: number) => void;
}

export default function AddressesTab({
    addresses,
    onAddNew,
    onEdit,
    onDelete,
}: AddressesTabProps) {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-[#f0f0f0] uppercase tracking-widest">Mis Direcciones</h2>
                <button
                    onClick={onAddNew}
                    className="w-full sm:w-auto bg-[#f0f0f0] hover:bg-white text-[#0e0e0e] px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors text-center"
                >
                    + Añadir Dirección
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                    <div className="col-span-2 bg-[#161616] border border-[#2d2d2d] rounded-sm p-8 text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#555555]">No tienes direcciones guardadas.</p>
                    </div>
                ) : (
                    addresses.map((addr: any, idx: number) => (
                        <div
                            key={addr.id || idx}
                            className={`border bg-[#161616] transition-colors rounded-sm p-5 relative ${
                                addr.is_default ? "border-[#f0f0f0]" : "border-[#2d2d2d] hover:border-[#555555]"
                            }`}
                        >
                            {addr.is_default && (
                                <span className="absolute top-4 right-4 text-[9px] font-bold text-[#0e0e0e] bg-[#f0f0f0] px-2 py-1 rounded-sm uppercase tracking-widest">
                                    Principal
                                </span>
                            )}
                            <p className="font-bold text-[#f0f0f0] uppercase tracking-widest text-sm flex items-center gap-2 mb-3">
                                <MapPin size={14} strokeWidth={2} className="text-[#888888]" /> {addr.alias || "Dirección"}
                            </p>
                            <p className="text-sm font-light text-[#888888] mb-1">
                                {addr.street} #{addr.exterior_number}{" "}
                                {addr.interior_number ? `Int. ${addr.interior_number}` : ""}
                            </p>
                            <p className="text-sm font-light text-[#888888] mb-1">Col. {addr.neighborhood}</p>
                            <p className="text-sm font-light text-[#888888] mb-3">
                                {addr.city}, {addr.state} {addr.postal_code}
                            </p>
                            {addr.phone && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-1">📞 {addr.phone}</p>
                            )}
                            {addr.reference && (
                                <p className="text-[10px] uppercase tracking-widest text-[#555555] mb-3">Ref: {addr.reference}</p>
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0f0f0] mb-5">{addr.country}</p>
                            <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
                                <button
                                    onClick={() => onEdit(addr)}
                                    className="text-[#f0f0f0] hover:text-[#888888] border-b border-transparent hover:border-[#888888] pb-0.5 transition-colors"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(addr.id)}
                                    className="text-red-500 hover:text-red-400 border-b border-transparent hover:border-red-400 pb-0.5 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
