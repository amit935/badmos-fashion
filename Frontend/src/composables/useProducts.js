// composables/useProducts.js
import { ref, computed } from 'vue';
import client from '../api/client';
import { 
  GET_PRODUCT_BY_ID, 
  GET_COLLECTION_PRODUCTS,
  GET_PRODUCT_BY_SLUG 
} from '../api/queries';

export function useProducts(initialData = []) {
  const products = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Detect what type of data we received
  const dataType = computed(() => {
    if (!initialData || initialData.length === 0) return 'empty';
    
    const first = initialData[0];
    
    // Check if it's a full product object
    if (typeof first === 'object' && first?.id && (first?.name || first?.slug)) {
      return 'products';
    }
    
    // Check if it's product IDs (strings/numbers)
    if (typeof first === 'string' || typeof first === 'number') {
      return 'ids';
    }
    
    return 'unknown';
  });

  // Fetch single product by ID (full details)
  const fetchProductById = async (id) => {
    const response = await client.request(GET_PRODUCT_BY_ID, { id: String(id) });
    return response.product;
  };

  // Fetch product IDs by collection slug (lightweight query)
  const fetchProductIdsByCollection = async (slug) => {
    const response = await client.request(GET_COLLECTION_PRODUCTS, { slug: String(slug) });
    // Extract productIds from search results
    const items = response.search?.items || [];
    return items.map(item => item.productId || item.id);
  };

  // Load products by IDs (fetches full details)
  const loadProductsByIds = async (productIds) => {
    if (!productIds || productIds.length === 0) {
      products.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;
    products.value = [];

    try {
      console.log('📦 Fetching full details for', productIds.length, 'products...');
      
      // Fetch all products in parallel for better performance
      const productPromises = productIds.map(id => fetchProductById(id));
      const fetchedProducts = await Promise.all(productPromises);
      
      products.value = fetchedProducts.filter(p => p); // Filter out null/undefined
      
      console.log('✅ Loaded', products.value.length, 'products with full details');
    } catch (err) {
      console.error('❌ Error fetching products by IDs:', err);
      error.value = 'Failed to fetch products by IDs.';
    } finally {
      isLoading.value = false;
    }
  };

  // Load products by collection slugs (two-step process)
  const loadProductsByCollections = async (slugs) => {
    if (!slugs || slugs.length === 0) {
      products.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;
    products.value = [];

    try {
      console.log('🔍 Fetching product IDs from', slugs.length, 'collection(s)...');
      
      // Step 1: Fetch product IDs from all collections in parallel
      const idPromises = slugs.map(slug => fetchProductIdsByCollection(slug));
      const idResults = await Promise.all(idPromises);
      
      // Flatten and deduplicate product IDs (in case same product in multiple collections)
      const allProductIds = [...new Set(idResults.flat())];
      
      console.log('📌 Found', allProductIds.length, 'product IDs across all collections');
      
      if (allProductIds.length === 0) {
        console.log('⚠️ No products found in collections');
        products.value = [];
        isLoading.value = false;
        return;
      }

      // Step 2: Load full product details using loadProductsByIds
      console.log('📥 Now loading full product details...');
      await loadProductsByIds(allProductIds);
      
    } catch (err) {
      console.error('❌ Error fetching products by collections:', err);
      error.value = 'Failed to fetch products by collections.';
      isLoading.value = false;
    }
  };

  // Fetch single product by slug
  const fetchProductBySlug = async (slug) => {
    if (!slug) return null;

    try {
      const response = await client.request(GET_PRODUCT_BY_SLUG, { slug });
      return response.product || null;
    } catch (err) {
      console.error('❌ Error fetching product by slug:', err);
      error.value = 'Failed to fetch product by slug.';
      return null;
    }
  };

  // Load single product by slug and set products ref to single-item array
  const loadProductBySlug = async (slug) => {
    isLoading.value = true;
    error.value = null;
    products.value = [];

    try {
      const product = await fetchProductBySlug(slug);
      if (product) {
        products.value = [product];
      } else {
        products.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  };

  // Generic reload function that detects data type
  const reload = async (data = initialData) => {
    if (!data || data.length === 0) {
      products.value = [];
      isLoading.value = false;
      return;
    }

    const first = data[0];

    // If already full products, just set them
    if (typeof first === 'object' && first?.id && first?.variants) {
      products.value = data;
      isLoading.value = false;
      console.log('✅ Using direct products:', data.length);
      return;
    }

    // If IDs, fetch full details by IDs
    if (typeof first === 'string' || typeof first === 'number') {
      console.log('🔄 Reloading products from IDs:', data.length);
      await loadProductsByIds(data);
    }
  };

  // Auto-load on initialization if data provided
  if (initialData && initialData.length > 0) {
    reload(initialData);
  }

  return {
    products,
    isLoading,
    error,
    reload,
    loadProductsByIds,
    loadProductsByCollections,
    loadProductBySlug,
    dataType,
  };
}
