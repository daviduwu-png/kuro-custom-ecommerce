import { ShoppingBag, Coffee, Shirt, HardHat, Dumbbell } from "lucide-react";

export const normalizeCategory = (category) => {
  const cat = (category || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (cat.includes("short") && cat.includes("box")) {
    return "shorts_box";
  }

  if (cat.includes("sudadera")) return "sudaderas";
  if (cat.includes("taza")) return "tazas";
  if (cat.includes("gorra")) return "gorras";
  if (cat.includes("playera") || cat.includes("shirt")) return "playeras";

  return cat || "playeras";
};

const CATEGORY_UI = {
  playeras: {
    img: "/mockups/playera.png",
    icon: <Shirt size={20} />,
    label: "Playeras",
  },
  sudaderas: {
    img: "/mockups/sudadera.png",
    icon: <ShoppingBag size={20} />,
    label: "Sudaderas",
  },
  tazas: {
    img: "/mockups/taza.png",
    icon: <Coffee size={20} />,
    label: "Tazas",
  },
  gorras: {
    img: "/mockups/gorra.png",
    icon: <HardHat size={20} />,
    label: "Gorras",
  },
  shorts_box: {
    img: "/mockups/shorts-box.png",
    icon: <Dumbbell size={20} />,
    label: "Shorts para box",
  },
};

export const getCategoryLabel = (category) => {
  const key = normalizeCategory(category);
  return CATEGORY_UI[key]?.label || key.replace(/_/g, " ");
};

export const getMockupForCategory = (category) => {
  const key = normalizeCategory(category);
  const fallback = CATEGORY_UI.playeras;
  const ui = CATEGORY_UI[key] || fallback;

  return { ...ui, key };
};

/**
 * Paleta de colores disponibles para personalización.
 */
export const COLORES = [
  { nombre: "Blanco", hex: "#ffffff" },
  { nombre: "Negro", hex: "#262626" },
  { nombre: "Rojo", hex: "#ef4444" },
  { nombre: "Azul", hex: "#3b82f6" },
  { nombre: "Amarillo", hex: "#eab308" },
  { nombre: "Verde", hex: "#22c55e" },
];
