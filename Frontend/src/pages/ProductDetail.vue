<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProducts } from '../composables/useProducts';
import { usePriceFormatter } from '../composables/usePriceFormatter';
import { useCart } from '../composables/useCart';
import ProductImageCarousel from '../components/product/ProductImageCarousel.vue';
import Button from '../components/ui/Button.vue';


const route = useRoute();
const router = useRouter();
const product = ref(null);
const isLoading = ref(false);
const error = ref(null);
const selectedOptions = ref({});


// USE ORDER STORE through useCart composable
const { 
  activeOrder,
  isLoading: cartLoading,
  error: cartError,
  addToCart,
  updateQuantity,
  removeFromCart,
  fetchActiveOrder,
  clearError 
} = useCart();


const productSlug = computed(() => route.params.productSlug);
const { formatPrice } = usePriceFormatter();


const {
  products,
  loadProductBySlug,
  isLoading: productsLoading,
  error: productsError
} = useProducts();


// ============================================================================
// Cart-related Computed Properties
// ============================================================================


// Find the order line for the currently selected variant
const cartLineItem = computed(() => {
  if (!activeOrder.value || !selectedVariant.value) return null;
  
  return activeOrder.value.lines?.find(
    line => line.productVariant.id === selectedVariant.value.id
  ) || null;
});


// Check if selected variant is already in cart
const isInCart = computed(() => !!cartLineItem.value);


// Get current quantity in cart
const cartQuantity = computed(() => cartLineItem.value?.quantity || 0);


// ============================================================================
// Cart Functions - Using orderStore methods
// ============================================================================


const handleAddToCart = async (variantId) => {
  const result = await addToCart(variantId, 1);
  return result.success
};


const handleUpdateQuantity = async (newQuantity) => {
  if (!cartLineItem.value) return;
  if (newQuantity <= 0) {
    await removeFromCart(cartLineItem.value.id);
  } else {
    await updateQuantity(cartLineItem.value.id, newQuantity);
  }
};


const incrementQuantity = () => {
  handleUpdateQuantity(cartQuantity.value + 1);
};


const decrementQuantity = () => {
  handleUpdateQuantity(cartQuantity.value - 1);
};


// ============================================================================
// Product Option Selection Logic
// ============================================================================


const updateQueryParams = (options) => {
  const newQuery = {};
  
  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      newQuery[key] = value.toString();
    }
  });
  
  router.replace({ query: newQuery });
};


const parentOptionGroup = computed(() => {
  return product.value?.optionGroups?.find(g => g.customFields.isParentGroup === true) || null;
});


const filteredNonParentOptions = computed(() => {
  if (!product.value) return {};
  const result = {};
  if (!parentOptionGroup.value) return result;


  const parentCode = parentOptionGroup.value.code;
  const selectedParentOption = selectedOptions.value[parentCode];


  for (const group of product.value.optionGroups) {
    if (group.code === parentCode) continue;


    const optionsSet = new Map();


    product.value.variants.forEach(variant => {
      if (!variant.options.some(vo => vo.group.code === parentCode && vo.code === selectedParentOption)) return;


      variant.options.forEach(vo => {
        if (vo.group.code === group.code) {
          optionsSet.set(vo.code, vo.name);
        }
      });
    });


    result[group.code] = {
      name: group.name,
      code: group.code,
      options: [...optionsSet.entries()].map(([code, name]) => ({ code, name }))
    };
  }


  return result;
});


const selectedVariant = computed(() => {
  if (!product.value) return null;
  return product.value.variants.find(variant =>
    variant.options.every(opt => selectedOptions.value[opt.group.code] === opt.code)
  ) || null;
});


const fetchProduct = async () => {
  if (!productSlug.value) return;


  isLoading.value = true;
  error.value = null;


  try {
    const urlParams = { ...route.query };


    await loadProductBySlug(productSlug.value);
    product.value = (productsLoading.value === false && productsError.value === null) ?
      (products.value && products.value[0]) : null;


    if (!product.value) {
      throw new Error('Product not found');
    }


    const parentGroup = product.value?.optionGroups?.find(g => g.customFields.isParentGroup === true);
    
    if (parentGroup) {
      const parentCodesSet = new Set();
      product.value.variants.forEach(variant => {
        variant.options.forEach(opt => {
          if (opt.group.customFields.isParentGroup === true) {
            parentCodesSet.add(opt.code);
          }
        });
      });


      parentGroup.options = parentGroup.options.filter(opt => parentCodesSet.has(opt.code));


      if (urlParams[parentGroup.code]) {
        const parentOptionCode = urlParams[parentGroup.code];
        const isValid = parentGroup.options.some(opt => opt.code === parentOptionCode);
        
        selectedOptions.value[parentGroup.code] = isValid 
          ? parentOptionCode 
          : parentGroup.options[0]?.code;
      } else {
        selectedOptions.value[parentGroup.code] = parentGroup.options[0]?.code;
      }


      product.value.optionGroups.forEach(group => {
        if (group.customFields.isParentGroup === true) return;


        const filteredOpts = group.options.filter(opt =>
          product.value.variants.some(variant =>
            variant.options.some(vo =>
              vo.group.customFields.isParentGroup === true && 
              vo.code === selectedOptions.value[parentGroup.code]
            ) &&
            variant.options.some(vo =>
              vo.group.code === group.code && vo.code === opt.code
            )
          )
        );


        if (urlParams[group.code]) {
          const urlOptionCode = urlParams[group.code];
          const isValid = filteredOpts.some(opt => opt.code === urlOptionCode);
          
          selectedOptions.value[group.code] = isValid 
            ? urlOptionCode 
            : (filteredOpts[0]?.code || group.options[0]?.code || null);
        } else {
          selectedOptions.value[group.code] = filteredOpts[0]?.code || group.options[0]?.code || null;
        }
      });
    }


    // Fetch active order to check if variants are in cart
    await fetchActiveOrder();


  } catch (err) {
    error.value = 'Failed to load product details';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};


watch(selectedOptions, newVal => {
  let changed = false;


  if (parentOptionGroup.value) {
    const parentOpts = parentOptionGroup.value.options;
    if (!parentOpts.find(o => o.code === newVal[parentOptionGroup.value.code])) {
      newVal[parentOptionGroup.value.code] = parentOpts.length > 0 ? parentOpts[0].code : null;
      changed = true;
    }
  }


  Object.entries(filteredNonParentOptions.value).forEach(([groupCode, group]) => {
    if (!group.options.find(o => o.code === newVal[groupCode])) {
      newVal[groupCode] = group.options.length > 0 ? group.options[0].code : null;
      changed = true;
    }
  });


  if (changed) {
    selectedOptions.value = { ...newVal };
  }
  
  updateQueryParams(newVal);
}, { deep: true });


watch(productSlug, () => {
  fetchProduct();
});


onMounted(() => {
  if (productSlug.value) {
    fetchProduct();
  }
});
</script>


<template>
  <section class="relative max-width">
    <!-- <div v-if="isLoading"></div> -->
    <Spinner v-if="isLoading || productsLoading" size="lg" message="Loading product details..." />
    <div v-else-if="error || productsError" class="text-red-600 text-center">
      <p>Error loading product: {{ error || productsError }}</p>
    </div>


    <div v-else-if="product" class="product-section-container flex justify-center gap-12">
      <!-- Product Image -->
      <div class="product-image-container w-1/2">
        <ProductImageCarousel :assets="selectedVariant?.assets.length ? selectedVariant.assets : product.assets" />
      </div>


      <!-- Product Details -->
      <div class="product-detail-container w-1/2 flex flex-col justify-start">
        <h1 class="text-3xl font-bold mb-4 leading-snug line-clamp-2">{{ product.name }}</h1>
        <p class="text-gray-700 mb-6" v-html="product.description"></p>


        <div v-if="selectedVariant" class="mb-6 text-2xl font-semibold">
          {{ formatPrice(selectedVariant.priceWithTax) }}
        </div>


        <!-- Parent Option Group -->
        <div v-if="parentOptionGroup" class="mb-6">
          <p class="font-semibold mb-2 block capitalize">{{ parentOptionGroup.name }}</p>
          <div class="options-container">
            <button
              v-for="opt in parentOptionGroup.options"
              :key="opt.id"
              :class="['option-btn uppercase', { 'selected': selectedOptions[parentOptionGroup.code] === opt.code }]"
              @click="selectedOptions[parentOptionGroup.code] = opt.code"
            >
              {{ opt.name }}
            </button>
          </div>
        </div>


        <!-- Other Option Groups -->
        <div v-for="(group, code) in filteredNonParentOptions" :key="code" v-if="code !== 'color'" class="mb-6">
          <p class="font-semibold mb-2 block capitalize">{{ group.name }}</p>
          <div class="options-container">
            <button
              v-for="opt in group.options"
              :key="opt.code"
              :class="['option-btn uppercase', { 'selected': selectedOptions[group.code] === opt.code }]"
              @click="selectedOptions[group.code] = opt.code"
            >
              {{ opt.name }}
            </button>
          </div>
        </div>


        <!-- Cart Actions: Add to Cart OR Quantity Controls -->
        <div class="space-x-2 mb-6">
          <!-- Show quantity controls if item is already in cart -->
          <div v-if="isInCart" class="flex items-center gap-3">
            <div class="quantity-controls flex items-center border border-black">
              <button 
                @click="decrementQuantity" 
                :disabled="cartLoading"
                class="quantity-btn px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              >
                -
              </button>
              <span class="px-4 py-2 font-semibold min-w-[40px] text-center">
                {{ cartQuantity }}
              </span>
              <button 
                @click="incrementQuantity" 
                :disabled="cartLoading"
                class="quantity-btn px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              >
                +
              </button>
            </div>
            <span class="text-sm text-gray-600">In Cart</span>
          </div>


          <!-- Show Add to Cart button if not in cart -->
          <Button 
            v-else
            @click="handleAddToCart(selectedVariant.id)" 
            :disabled="cartLoading"
            text="add to cart"
            contentClasses="w-full uppercase"
          />
        </div>
      </div>
    </div>


    <div v-else class="text-center text-gray-600">
      <p>Product not found.</p>
    </div>
  </section>
</template>
<style scoped>
.spinner {
  border-width: 4px;
  border-style: solid;
  border-radius: 9999px;
  border-top-color: transparent;
  width: 3rem;
  height: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.product-section-container {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

@media (max-width: 768px) {
  .product-section-container {
    flex-direction: column;
    gap: 1.5rem;
  }

  .product-image-container,
  .product-detail-container {
    width: 100% !important;
  }

  .product-detail-container {
    padding-inline: 12px;
  }
}

.product-image-container {
  width: 50%;
}

.product-detail-container {
  width: 50%;
}

.options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-btn {
  padding: 6px 10px;
  border: 1px solid #000;
  background: #fff;
  color: #000;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  border-radius: 2px;
  white-space: nowrap;
}

.option-btn.selected {
  background-color: #000;
  color: #fff;
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-controls {
  border-radius: 2px;
}

.quantity-btn {
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.quantity-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
