import { atom } from "nanostores";
import { persistentMap } from "@nanostores/persistent";
import { sileo } from "sileo";

export const isCartOpen = atom(false);

export const cartItems = persistentMap(
  "cart:",
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export function addCartItem(producto) {
  const variantSuffix = producto.selectedVariant ? producto.selectedVariant.id : "base";
  const uniqueId = `${producto.id}-${variantSuffix}`;

  const existingEntry = cartItems.get()[uniqueId];

  const stockDisponible = producto.selectedVariant ? producto.selectedVariant.stock : 999;

  const cantidadActual = existingEntry ? existingEntry.cantidad : 0;

  if (cantidadActual + 1 > stockDisponible) {
    sileo.warning({ title: `Lo sentimos, solo hay ${stockDisponible} unidades disponibles de esta talla.` });
    return;
  }

  if (existingEntry) {
    cartItems.setKey(uniqueId, {
      ...existingEntry,
      cantidad: existingEntry.cantidad + 1,
    });
  } else {
    cartItems.setKey(uniqueId, {
      ...producto,
      cartItemId: uniqueId,
      cantidad: 1,
    });
  }

  isCartOpen.set(true);
}

export function removeCartItem(uniqueId) {
  cartItems.setKey(uniqueId, undefined);
}

export function decreaseCartItem(uniqueId) {
  const existingEntry = cartItems.get()[uniqueId];

  if (existingEntry && existingEntry.cantidad > 1) {
    cartItems.setKey(uniqueId, {
      ...existingEntry,
      cantidad: existingEntry.cantidad - 1,
    });
  } else {
    removeCartItem(uniqueId);
  }
}
