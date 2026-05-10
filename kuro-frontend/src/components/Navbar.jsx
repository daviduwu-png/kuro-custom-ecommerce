import { useState, useEffect } from "react";
import { Menu, X, User, ShoppingBag, Palette, LogOut } from "lucide-react";
import CartDrawer from "./CartDrawer";
import { useStore } from "@nanostores/react";
import { cartItems, isCartOpen } from "../store/cartStore";
import { userInfo, initUser, logout } from "../store/userStore";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const $cartItems = useStore(cartItems);

  const $user = useStore(userInfo);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initUser();
  }, []);

  const totalItems = Object.values($cartItems).reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#2d2d2d]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center space-x-3 group">
            <div className="bg-[#161616] p-1.5 rounded-sm border border-[#2d2d2d] group-hover:border-[#555555] transition-colors">
              <img src="/kuro-logo.png" alt="Kuro Custom Logo" className="h-7 w-auto" />
            </div>
            <h1 className="text-xl font-bold text-[#f0f0f0] tracking-widest uppercase">Kuro Custom</h1>
          </a>

          {/* MENÚ DE ESCRITORIO */}
          <div className="hidden md:flex items-center space-x-10">
            <a href="/" className="text-[#888888] hover:text-[#f0f0f0] text-sm tracking-wide transition-colors">
              INICIO
            </a>
            <a href="/catalogo" className="text-[#888888] hover:text-[#f0f0f0] text-sm tracking-wide transition-colors">
              CATÁLOGO
            </a>
            <a
              href="/personalizar"
              className="flex items-center gap-2 bg-[#f0f0f0] text-[#0e0e0e] px-5 py-2 text-sm font-bold tracking-wide hover:bg-white transition-all"
            >
              <Palette size={14} /> PERSONALIZAR
            </a>

            <div className="flex items-center gap-5 border-l border-[#2d2d2d] pl-8">
              <button
                onClick={() => isCartOpen.set(true)}
                className="group relative text-[#888888] hover:text-[#f0f0f0] transition-colors"
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {isMounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#f0f0f0] text-[#0e0e0e] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-sm animate-bounce-short">
                    {totalItems}
                  </span>
                )}
              </button>

              {isMounted && $user ? (
                // Usuario Logueado
                <div className="flex items-center gap-4 animate-fade-in">
                  <span className="text-xs font-bold text-[#888888] bg-[#161616] border border-[#2d2d2d] px-3 py-1 rounded-sm hidden lg:inline-block">
                    {$user.name}
                  </span>
                  <a
                    href="/cuenta"
                    className="text-[#888888] hover:text-[#f0f0f0] transition-colors tooltip flex items-center gap-1"
                    title="Mi Cuenta"
                  >
                    <User size={20} strokeWidth={1.5} />
                  </a>
                  <button
                    onClick={logout}
                    className="text-[#555555] hover:text-[#f0f0f0] transition-colors tooltip flex items-center gap-1"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                //  Invitado (No logueado)
                <a href="/login" className="text-[#888888] hover:text-[#f0f0f0] transition-colors">
                  <User size={20} strokeWidth={1.5} />
                </a>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-5">
            <button onClick={() => isCartOpen.set(true)} className="text-[#888888] hover:text-[#f0f0f0] relative transition-colors">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#f0f0f0] text-[#0e0e0e] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-sm">
                  {totalItems}
                </span>
              )}
            </button>

            <button onClick={() => setIsOpen(!isOpen)} className="text-[#888888] hover:text-[#f0f0f0] transition-colors">
              {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#161616] border-t border-[#2d2d2d] shadow-2xl py-6 px-6 flex flex-col space-y-2 animate-fade-in-down">
            <a href="/" className="text-[#888888] hover:text-[#f0f0f0] font-medium py-3 border-b border-[#2d2d2d] tracking-wide text-sm">
              INICIO
            </a>
            <a
              href="/catalogo"
              className="text-[#888888] hover:text-[#f0f0f0] font-medium py-3 border-b border-[#2d2d2d] tracking-wide text-sm"
            >
              CATÁLOGO
            </a>
            <a href="/personalizar" className="text-[#f0f0f0] font-bold py-4 flex items-center gap-3 tracking-wide text-sm">
              <Palette size={16} strokeWidth={1.5} /> PERSONALIZAR ROPA
            </a>

            {isMounted && $user ? (
              <div className="flex flex-col gap-3 mt-4">
                <a
                  href="/cuenta"
                  className="bg-[#2d2d2d] text-[#f0f0f0] w-full py-3 rounded-sm font-medium tracking-wide text-sm flex items-center justify-center gap-2"
                >
                  <User size={16} strokeWidth={1.5} /> MI CUENTA
                </a>
                <button
                  onClick={logout}
                  className="border border-[#2d2d2d] text-[#888888] hover:text-[#f0f0f0] hover:border-[#555555] w-full py-3 rounded-sm font-medium tracking-wide text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.5} /> CERRAR SESIÓN
                </button>
              </div>
            ) : (
              <a href="/login" className="bg-[#f0f0f0] text-[#0e0e0e] text-center py-3 rounded-sm font-bold mt-4 tracking-wide text-sm">
                INICIAR SESIÓN
              </a>
            )}
          </div>
        )}
      </nav>

      <CartDrawer />
    </>
  );
}
