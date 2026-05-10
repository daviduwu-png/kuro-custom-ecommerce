export default function ContactInfo({ email, setEmail, telefono, setTelefono }) {
    return (
        <section>
            <h2 className="text-[10px] font-bold text-[#f0f0f0] uppercase tracking-widest mb-4 flex items-center gap-3">
                <span className="w-5 h-5 bg-[#f0f0f0] text-[#0e0e0e] rounded-sm flex items-center justify-center text-[10px] font-bold">
                    1
                </span>
                Información de Contacto
            </h2>

            <div className="space-y-4">
                <input
                    id="checkout-email"
                    type="email"
                    placeholder="Correo electrónico *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-4 py-3 focus:border-[#555555] outline-none text-sm text-[#f0f0f0] transition placeholder-[#555555]"
                />
                <input
                    id="checkout-telefono"
                    type="tel"
                    placeholder="Teléfono de contacto"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-4 py-3 focus:border-[#555555] outline-none text-sm text-[#f0f0f0] transition placeholder-[#555555]"
                />
            </div>
        </section>
    );
}
