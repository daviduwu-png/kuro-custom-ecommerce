export function StripeLogo() {
    return (
        <img 
            src="stripe.svg" 
            alt="Pagar con Stripe" 
            className="h-10 md:h-12 object-contain" 
            style={{ filter: "brightness(0) invert(1)" }} 
        />
    );
}

export function MPLogo() {
    return (
        <img 
            src="mercado.svg" 
            alt="Pagar con Mercado Pago" 
            className="h-10 md:h-12 object-contain" 
            style={{ filter: "brightness(0) invert(1)" }} 
        />
    );
}
