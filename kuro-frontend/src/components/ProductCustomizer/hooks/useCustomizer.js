import { useState, useRef, useEffect } from "react";
import { sileo } from "sileo";
import { addCartItem } from "../../../store/cartStore";
import { productService } from "../../../services/productService";
import { getMockupForCategory } from "../utils/mockupUtils.jsx";

/**
 * Hook que encapsula toda la lógica de estado y efectos del ProductCustomizer.
 * Los componentes de UI solo consumen este hook y no tienen lógica de negocio propia.
 */
export function useCustomizer() {
  // --- Estado de productos ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productoActual, setProductoActual] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Estado del editor ---
  const [color, setColor] = useState("#ffffff");
  const [logo, setLogo] = useState(null);
  const [scale, setScale] = useState(1);
  const [tallaId, setTallaId] = useState(null);
  const [adding, setAdding] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef(null);
  const draggableRef = useRef(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await productService.getAllProducts();
        const customizables = data.filter((p) => p.is_customizable);
        setProductosDisponibles(customizables);

        if (customizables.length > 0) {
          _aplicarSeleccion(customizables[0]);
        }
      } catch (error) {
        console.error("Error cargando productos personalizables:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  function _aplicarSeleccion(prod) {
    setProductoActual(prod);
    setLogo(null);
    setColor("#ffffff");
    setScale(1);
    setTallaId(prod.variants?.length > 0 ? prod.variants[0].id : null);
  }

  const seleccionarProducto = (prod) => {
    _aplicarSeleccion(prod);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      sileo.error({
        title: "Imagen demasiado pesada",
        description: "El diseño no debe superar los 5MB.",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => setLogo(event.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetEditor = () => {
    setLogo(null);
    setColor("#ffffff");
    setScale(1);
    if (productoActual?.variants?.length > 0) {
      setTallaId(productoActual.variants[0].id);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAgregarAlCarrito = async () => {
    if (!productoActual) return;

    if (productoActual.variants?.length > 0 && !tallaId) {
      sileo.error({ title: "Falta talla", description: "Selecciona una talla para continuar." });
      return;
    }

    setAdding(true);
    try {
      const mockupInfo = getMockupForCategory(productoActual.category);
      const varianteSeleccionada = productoActual.variants?.find((v) => v.id === tallaId) || null;

      const cartItem = {
        id: productoActual.id,
        cartItemId: `custom-${productoActual.id}-${tallaId || "novar"}-${Date.now()}`,
        name: `${productoActual.name} Personalizada`,
        price: Number(productoActual.price) + 150,
        image: mockupInfo.img,
        category: productoActual.category,
        cantidad: 1,
        selectedVariant: varianteSeleccionada,
        customization: {
          product_type: productoActual.category,
          base_color: color,
          design_image: logo || null,
          scale: scale,
        },
      };

      addCartItem(cartItem);
      sileo.success({
        title: "¡Producto agregado!",
        description: `${productoActual.name} personalizada añadida al carrito.`,
      });
      resetEditor();
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      sileo.error({ title: "Error", description: "No se pudo agregar el producto." });
    } finally {
      setAdding(false);
    }
  };

  return {
    // Estado
    productosDisponibles,
    productoActual,
    loading,
    color,
    logo,
    scale,
    tallaId,
    adding,
    // Refs
    fileInputRef,
    draggableRef,
    // Setters simples
    setColor,
    setScale,
    setTallaId,
    setLogo,
    // Acciones
    seleccionarProducto,
    handleImageUpload,
    resetEditor,
    handleAgregarAlCarrito,
  };
}
