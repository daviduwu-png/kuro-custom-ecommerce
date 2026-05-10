import React from "react";
import { Edit2, X, Save, Loader2 } from "lucide-react";

interface ProfileTabProps {
    displayName: string;
    displayLastName: string;
    email: string;
    phone: string;
    editing: boolean;
    saving: boolean;
    form: { first_name: string; last_name: string; email: string; phone: string };
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onFormChange: (field: keyof ProfileTabProps["form"], value: string) => void;
}

export default function ProfileTab({
    displayName,
    displayLastName,
    email,
    phone,
    editing,
    saving,
    form,
    onEdit,
    onCancel,
    onSave,
    onFormChange,
}: ProfileTabProps) {
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#f0f0f0] uppercase tracking-widest">Mi Perfil</h2>
                {!editing ? (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#0e0e0e] hover:text-[#0e0e0e] bg-[#f0f0f0] hover:bg-white px-4 py-2 rounded-sm transition-all"
                    >
                        <Edit2 size={13} strokeWidth={2} /> Editar
                    </button>
                ) : (
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#888888] hover:text-[#f0f0f0] bg-[#1f1f1f] hover:bg-[#2d2d2d] px-4 py-2 rounded-sm border border-[#2d2d2d] transition-all"
                    >
                        <X size={13} strokeWidth={2} /> Cancelar
                    </button>
                )}
            </div>

            {!editing ? (
                /* Vista de solo lectura */
                <div className="space-y-4">
                    {[
                        { label: "Nombre", value: `${displayName} ${displayLastName}`.trim() },
                        { label: "Correo electrónico", value: email },
                        { label: "Teléfono", value: phone || "No registrado" },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="flex flex-col sm:flex-row sm:items-center gap-1 py-4 border-b border-[#2d2d2d]"
                        >
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#555555] sm:w-44">{label}</span>
                            <span className="text-sm text-[#f0f0f0]">{value}</span>
                        </div>
                    ))}
                </div>
            ) : (
                /* Formulario de edición */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-2">Nombre</label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={(e) => onFormChange("first_name", e.target.value)}
                                className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-4 py-3 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-2">Apellidos</label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={(e) => onFormChange("last_name", e.target.value)}
                                className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-4 py-3 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                placeholder="Tus apellidos"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-2">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            disabled
                            className="w-full bg-[#0e0e0e] border border-[#2d2d2d] rounded-sm px-4 py-3 text-sm text-[#555555] cursor-not-allowed"
                        />
                        <p className="text-[10px] uppercase tracking-widest text-[#555555] mt-2">
                            El correo no se puede cambiar desde aquí.
                        </p>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-2">Teléfono</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => onFormChange("phone", e.target.value)}
                            className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-4 py-3 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                            placeholder="Ej: 5512345678"
                        />
                    </div>
                    <div className="pt-6 border-t border-[#2d2d2d]">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#f0f0f0] hover:bg-white text-[#0e0e0e] px-8 py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                            ) : (
                                <Save size={14} strokeWidth={2} />
                            )}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
