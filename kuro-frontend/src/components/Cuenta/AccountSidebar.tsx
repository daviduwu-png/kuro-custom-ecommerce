import React from "react";
import { Package, MapPin, User, LogOut, ShieldCheck } from "lucide-react";

type Tab = "pedidos" | "direcciones" | "perfil";

interface AccountSidebarProps {
    displayName: string;
    displayLastName: string;
    email: string;
    phone?: string;
    isAdmin: boolean;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onLogout: () => void;
}

export default function AccountSidebar({
    displayName,
    displayLastName,
    email,
    phone,
    isAdmin,
    activeTab,
    onTabChange,
    onLogout,
}: AccountSidebarProps) {
    const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
        { tab: "pedidos", icon: <Package size={18} strokeWidth={1.5} />, label: "Mis Pedidos" },
        { tab: "direcciones", icon: <MapPin size={18} strokeWidth={1.5} />, label: "Direcciones" },
        { tab: "perfil", icon: <User size={18} strokeWidth={1.5} />, label: "Mi Perfil" },
    ];

    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-[#161616] rounded-sm shadow-sm border border-[#2d2d2d] overflow-hidden">
                <div className="p-6 border-b border-[#2d2d2d] bg-[#0e0e0e]">
                    <p className="font-bold text-[#f0f0f0] uppercase tracking-widest text-sm mb-1">
                        {displayName} {displayLastName}
                    </p>
                    <p className="text-[10px] text-[#888888] font-light tracking-widest uppercase">{email}</p>
                    {phone && <p className="text-[10px] text-[#555555] mt-1 font-light tracking-widest uppercase">{phone}</p>}
                    {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#f0f0f0] bg-[#2d2d2d] px-2 py-1 rounded-sm uppercase tracking-widest border border-[#555555]">
                            <ShieldCheck size={11} strokeWidth={2} /> Administrador
                        </span>
                    )}
                </div>
                <nav className="flex flex-col p-2 gap-1">
                    {navItems.map(({ tab, icon, label }) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-xs uppercase tracking-widest transition-all text-left ${
                                activeTab === tab
                                    ? "text-[#0e0e0e] bg-[#f0f0f0]"
                                    : "text-[#888888] hover:bg-[#1f1f1f] hover:text-[#f0f0f0]"
                            }`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-sm font-bold text-xs uppercase tracking-widest transition-all text-left mt-2 border-t border-[#2d2d2d] w-full"
                    >
                        <LogOut size={18} strokeWidth={1.5} /> Cerrar Sesión
                    </button>
                </nav>
            </div>
        </aside>
    );
}
