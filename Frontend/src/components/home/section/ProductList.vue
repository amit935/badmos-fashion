<script setup>
import { computed, watch } from 'vue';
import SectionWrapper from '../SectionWrapper.vue';
import ProductCard from '../../product/ProductCard.vue';
import { useProducts } from '../../../composables/useProducts';

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  products: {
    type: Array,
    default: () => [],
  },
  categorySlugs: {
    type: Array,
    default: () => [],
  },
  productIds: {
    type: Array,
    default: () => [],
  },
  caption: {
    type: String,
    default: '',
  }
});

console.log('ProductList props:', props);

// Check if we have full product objects (Priority 1)
const hasFullProducts = computed(() => {
  return props.products.length > 0 && 
         props.products[0]?.id && 
         (props.products[0]?.name || props.products[0]?.slug);
});

console.log('Has full products:', hasFullProducts.value);

// Determine fetch strategy
const fetchStrategy = computed(() => {
  // Priority 1: Use full products if available
  if (hasFullProducts.value) {
    console.log('✓ Priority 1: Using full products:', props.products.length);
    return { type: 'direct', data: props.products };
  }
  
  // Priority 2: Use categorySlugs if available
  if (props.categorySlugs.length > 0) {
    console.log('✓ Priority 2: Using categorySlugs:', props.categorySlugs);
    return { type: 'collections', data: props.categorySlugs };
  }
  
  // Priority 3: Use productIds if available
  if (props.productIds.length > 0) {
    console.log('✓ Priority 3: Using productIds:', props.productIds.length);
    return { type: 'ids', data: props.productIds };
  }
  
  // Priority 4: Try to use products as IDs if they're strings/numbers
  if (props.products.length > 0 && typeof props.products[0] === 'string') {
    console.log('✓ Priority 4: Using products as IDs:', props.products.length);
    return { type: 'ids', data: props.products };
  }
  
  console.log('✗ No products, categories, or IDs available');
  return { type: 'none', data: [] };
});

// Initialize composable with strategy-based data
const { 
  products: fetchedProducts, 
  isLoading, 
  error, 
  loadProductsByIds,
  loadProductsByCollections
} = useProducts(
  fetchStrategy.value.type === 'direct' ? fetchStrategy.value.data : []
);

// Final products to display
const finalProducts = computed(() => {
  if (fetchStrategy.value.type === 'direct') {
    return fetchStrategy.value.data;
  }
  return fetchedProducts.value || [];
});

console.log('Final products count:', finalProducts.value?.length);
console.log('Is loading:', isLoading.value);

// Watch and reload based on strategy
watch(
  () => [props.products, props.categorySlugs, props.productIds, fetchStrategy.value.type],
  ([newProducts, newCategorySlugs, newProductIds, strategyType]) => {
    console.log('Watch triggered, strategy:', strategyType);
    
    if (strategyType === 'collections' && newCategorySlugs.length > 0) {
      console.log('→ Loading products by collections:', newCategorySlugs);
      loadProductsByCollections(newCategorySlugs);
    } else if (strategyType === 'ids') {
      const idsToLoad = newProductIds.length > 0 ? newProductIds : newProducts;
      if (idsToLoad && idsToLoad.length) {
        console.log('→ Loading products by IDs:', idsToLoad);
        loadProductsByIds(idsToLoad);
      }
    } else if (strategyType === 'direct') {
      console.log('→ Using direct products, no fetch needed');
    }
  },
  { immediate: true }
);
</script>

<template>
  <SectionWrapper :title="title" :caption="caption">
    <template #content>
      <div class="products-grid">
        <Spinner v-if="isLoading" size="lg" message="Loading..." />
        <template v-else-if="error">
          <p class="error">Error: {{ error }}</p>
        </template>
        <template v-else-if="!finalProducts || finalProducts.length === 0">
          <p class="no-products">No products available</p>
        </template>
        <template v-else>
          <ProductCard 
            v-for="product in finalProducts" 
            :key="product.id || product.slug"
            :product="product"
          />
        </template>
      </div>
    </template>
  </SectionWrapper>
</template>

<style scoped>
.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: stretch;
  min-height: 200px;
}

.products-grid > * {
  flex: 0 0 calc(25% - 15px);
  max-width: calc(25% - 15px);
}

.loading-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.error {
  width: 100%;
  text-align: center;
  padding: 40px 20px;
  color: #d32f2f;
  font-size: 16px;
}

.no-products {
  width: 100%;
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

@media (min-width: 1024px) {
  .products-grid {
    gap: 24px;
  }
  .products-grid > * {
    flex: 0 0 calc(25% - 18px);
    max-width: calc(25% - 18px);
  }
}

@media (max-width: 1023px) and (min-width: 769px) {
  .products-grid {
    gap: 16px;
  }
  .products-grid > * {
    flex: 0 0 calc(50% - 8px);
    max-width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .products-grid {
    gap: 12px;
  }
  .products-grid > * {
    flex: 0 0 calc(50% - 6px);
    max-width: calc(50% - 6px);
  }
}
</style>