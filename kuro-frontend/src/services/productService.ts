import api from "./api";

export const productService = {
  async getAllProducts() {
    try {
      const response = await api.get("/products/");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      return [];
    }
  },

  async getProductBySlug(slug: string) {
    try {
      const response = await api.get(`/products/${slug}/`);
      return response.data;
    } catch (error) {
      console.error(`Error buscando producto ${slug}:`, error);
      return null;
    }
  },

  async getProductsByCategory(category: string) {
    try {
      const response = await api.get(`/products/category/${category}/`);
      return response.data;
    } catch (error) {
      console.error(`Error buscando productos por categoría ${category}:`, error);
      return [];
    }
  },

  async getProductVariants(productId: number) {
    try {
      const response = await api.get(`/products/${productId}/variants/`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo variantes para producto ${productId}:`, error);
      return [];
    }
  },
};
