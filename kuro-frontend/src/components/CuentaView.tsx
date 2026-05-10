import React, { useEffect, useState } from "react";
import { profileService } from "../services/profileService";
import { orderService } from "../services/orderService";
import { refundService } from "../services/refundService";
import { logout } from "../store/userStore";
import AddressModal from "./AddressModal";
import OrderDetailModal from "./OrderDetailModal";
import { sileo } from "sileo";
import "sileo/styles.css";
import PaymentBanner, { type PaymentBannerState } from "./Cuenta/PaymentBanner";
import AccountSidebar from "./Cuenta/AccountSidebar";
import OrdersTab from "./Cuenta/OrdersTab";
import AddressesTab from "./Cuenta/AddressesTab";
import ProfileTab from "./Cuenta/ProfileTab";

export default function CuentaView() {
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"pedidos" | "direcciones" | "perfil">("pedidos");
    const [loading, setLoading] = useState(true);

    // SEGURIDAD: el orderId del banner se valida contra las órdenes reales del
    // usuario después de cargarlas. Así evitamos que alguien construya una URL
    // maliciosa como /cuenta?payment=success&order=999 para ver datos ajenos.
    const [paymentBanner, setPaymentBanner] = useState<PaymentBannerState | null>(null);

    // Guardamos los params de la URL mientras cargamos las órdenes del usuario
    const [pendingBannerParams, setPendingBannerParams] = useState<{
        type: "success" | "pending" | "failed";
        rawOrderId: string;
    } | null>(null);

    // Estado admin
    const [isAdmin, setIsAdmin] = useState(false);
    const [refundingId, setRefundingId] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<any>(null);

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    // Edición de perfil
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // NO mostramos el banner todavía: esperamos a que las órdenes se carguen
    // para poder validar que el orderId pertenece al usuario autenticado.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get("payment");
        const rawOrderId = params.get("order") || "";

        if (payment === "success" || payment === "pending" || payment === "failed") {
            setPendingBannerParams({ type: payment as "success" | "pending" | "failed", rawOrderId });
        }

        window.history.replaceState({}, "", "/cuenta");
    }, []);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [profileData, ordersData, addressesData] = await Promise.all([
                    profileService.getProfile(),
                    orderService.getOrders(),
                    profileService.getAddresses(),
                ]);
                setProfile(profileData);
                setOrders(ordersData);
                setAddresses(addressesData);

                // Detectar si el usuario es admin (is_staff)
                if (profileData?.is_staff || profileData?.user?.is_staff) {
                    setIsAdmin(true);
                }

                // Pre-cargar formulario de perfil
                setProfileForm({
                    first_name: profileData?.first_name || profileData?.user?.first_name || "",
                    last_name: profileData?.last_name || profileData?.user?.last_name || "",
                    email: profileData?.email || profileData?.user?.email || "",
                    phone: profileData?.phone || "",
                });

                // ── VALIDACIÓN DE SEGURIDAD DEL BANNER ──────────────────────
                // Solo mostrar el banner si el orderId existe y pertenece al
                // usuario. Esto previene que una URL fabricada como
                // /cuenta?payment=success&order=99 muestre datos de otra persona
                // o un éxito falso sobre una orden que nunca se procesó.
                if (pendingBannerParams) {
                    const { type, rawOrderId } = pendingBannerParams;

                    if (!rawOrderId) {
                        // Sin orderId en la URL — mostrar banner genérico sin ID
                        setPaymentBanner({ type });
                    } else {
                        const parsedId = parseInt(rawOrderId, 10);
                        const ownsOrder =
                            !isNaN(parsedId) &&
                            ordersData.some((o: any) => o.id === parsedId);

                        if (ownsOrder) {
                            setPaymentBanner({ type, orderId: rawOrderId });
                        } else {
                           
                            console.warn(
                                "[CuentaView] Banner ignorado: order_id no pertenece al usuario autenticado.",
                                rawOrderId
                            );
                        }
                    }
                    setPendingBannerParams(null);
                }
            } catch (error) {
                console.error("Error al cargar la cuenta:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
        
    }, []);

    
    useEffect(() => {
        if (!pendingBannerParams || loading) return;

        const { type, rawOrderId } = pendingBannerParams;
        if (!rawOrderId) {
            setPaymentBanner({ type });
        } else {
            const parsedId = parseInt(rawOrderId, 10);
            const ownsOrder = !isNaN(parsedId) && orders.some((o: any) => o.id === parsedId);
            if (ownsOrder) {
                setPaymentBanner({ type, orderId: rawOrderId });
            }
        }
        setPendingBannerParams(null);
    }, [pendingBannerParams, loading, orders]);

    const handleLogout = () => logout();

    

    const handleOpenModal = (address?: any) => {
        setSelectedAddress(address || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAddress(null);
    };

    const handleSaveAddress = async (formData: any) => {
        try {
            if (selectedAddress) {
                await profileService.updateAddress(selectedAddress.id, formData);
                sileo.success({ title: "Dirección actualizada correctamente" });
            } else {
                await profileService.addAddress(formData);
                sileo.success({ title: "Dirección añadida correctamente" });
            }
            const newAddresses = await profileService.getAddresses();
            setAddresses(newAddresses);
            handleCloseModal();
        } catch (error) {
            console.error(error);
            sileo.error({ title: "Ocurrió un error al guardar la dirección" });
            throw error;
        }
    };

    const handleDeleteAddress = async (id: number) => {
        const toastId = sileo.action({
            title: "¿Eliminar dirección?",
            description: "Esta acción no se puede deshacer.",
            styles: { description: "text-gray-300 text-sm" },
            button: {
                title: "Eliminar",
                onClick: async () => {
                    sileo.dismiss(toastId);
                    try {
                        await profileService.deleteAddress(id);
                        setAddresses((prev) => prev.filter((addr) => addr.id !== id));
                        sileo.success({ title: "Dirección eliminada correctamente" });
                    } catch (error) {
                        console.error(error);
                        sileo.error({ title: "No se pudo eliminar la dirección" });
                    }
                },
            },
        });
    };

    

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const updated = await profileService.updateProfile({
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                phone: profileForm.phone,
            });
            setProfile((prev: any) => ({ ...prev, ...updated }));
            setEditingProfile(false);
            sileo.success({ title: "Perfil actualizado correctamente" });
        } catch (error) {
            console.error(error);
            sileo.error({ title: "No se pudo actualizar el perfil" });
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Reembolsos (solo admin) ──────────────────────────────────────────────

    const handleRefund = async (order: any) => {
        const toastId = sileo.action({
            title: `¿Reembolsar orden #ORD-${String(order.id).padStart(3, "0")}?`,
            description: "Se procesará el reembolso completo y se restaurará el stock.",
            styles: { description: "text-gray-300 text-sm" },
            button: {
                title: "Confirmar reembolso",
                onClick: async () => {
                    sileo.dismiss(toastId);
                    setRefundingId(order.id);
                    try {
                        const result = await refundService.refundOrder(order.id);
                        sileo.success({
                            title: "Reembolso procesado",
                            description: `ID: ${result.refund_id}`,
                        });
                        setOrders((prev) =>
                            prev.map((o) =>
                                o.id === order.id ? { ...o, status: "cancelled" } : o
                            )
                        );
                    } catch (error: any) {
                        console.error(error);
                        const msg =
                            error?.response?.data?.error || "No se pudo procesar el reembolso.";
                        sileo.error({ title: "Error en reembolso", description: msg });
                    } finally {
                        setRefundingId(null);
                    }
                },
            },
        });
    };

    

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f0f0f0]"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center p-10 bg-[#161616] border border-[#2d2d2d] rounded-sm">
                <p className="text-[#888888] font-bold uppercase tracking-widest text-[10px] mb-4">No se pudo cargar la información de la cuenta.</p>
                <button onClick={handleLogout} className="text-[#f0f0f0] text-[10px] uppercase tracking-widest font-bold border-b border-[#f0f0f0] hover:border-[#888888] hover:text-[#888888] pb-0.5 transition-colors">
                    Volver a iniciar sesión
                </button>
            </div>
        );
    }

    const displayName = profile.first_name || profile.user?.first_name || "Usuario";
    const displayLastName = profile.last_name || profile.user?.last_name || "";

    return (
        <div className="flex flex-wrap gap-8">
            <AddressModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAddress}
                initialData={selectedAddress}
            />

            <OrderDetailModal
                order={selectedOrder}
                isOpen={isOrderModalOpen}
                onClose={() => {
                    setIsOrderModalOpen(false);
                    setSelectedOrder(null);
                }}
            />

            {paymentBanner && (
                <div className="w-full" style={{ flexBasis: "100%", order: -1 }}>
                    <PaymentBanner
                        banner={paymentBanner}
                        onDismiss={() => setPaymentBanner(null)}
                    />
                </div>
            )}

            <AccountSidebar
                displayName={displayName}
                displayLastName={displayLastName}
                email={profile.user?.email || profile.email}
                phone={profile.phone}
                isAdmin={isAdmin}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
            />

            {/* ── Contenido principal ── */}
            <main className="flex-1">
                <div className="bg-[#161616] rounded-sm shadow-xl border border-[#2d2d2d] p-6 text-[#f0f0f0]">

                    {activeTab === "pedidos" && (
                        <OrdersTab
                            orders={orders}
                            isAdmin={isAdmin}
                            refundingId={refundingId}
                            onViewOrder={(order) => {
                                setSelectedOrder(order);
                                setIsOrderModalOpen(true);
                            }}
                            onRefund={handleRefund}
                        />
                    )}

                    {activeTab === "direcciones" && (
                        <AddressesTab
                            addresses={addresses}
                            onAddNew={() => handleOpenModal()}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteAddress}
                        />
                    )}

                    {activeTab === "perfil" && (
                        <ProfileTab
                            displayName={displayName}
                            displayLastName={displayLastName}
                            email={profile.user?.email || profile.email}
                            phone={profile.phone || ""}
                            editing={editingProfile}
                            saving={savingProfile}
                            form={profileForm}
                            onEdit={() => setEditingProfile(true)}
                            onCancel={() => setEditingProfile(false)}
                            onSave={handleSaveProfile}
                            onFormChange={(field, value) =>
                                setProfileForm((p) => ({ ...p, [field]: value }))
                            }
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
