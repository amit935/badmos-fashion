<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SectionWrapper from '../components/home/SectionWrapper.vue';
import ProductCard from '../components/product/ProductCard.vue';
import Dropdown from '../components/ui/Dropdown.vue';
import { useProducts } from '../composables/useProducts';
import { useQueryCollection } from '../composables/useQueryCollection';
import Button from '../components/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const category = ref(null);

const itemsPerPage = 12;
const totalItems = ref(0);

// Use composables
const { 
  products, 
  isLoading: productsLoading,
  error: productsError,
  loadProductsByCollections
} = useProducts();

const {
  fetchCollection,
  isLoading: categoryLoading,
  error: categoryError
} = useQueryCollection();

const isLoading = computed(() => productsLoading.value || categoryLoading.value);
const error = computed(() => categoryError.value || productsError.value);

const categorySlug = computed(() => route.params.categorySlug);

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

// Reactive refs for sort and page derived from URL query parameters
const selectedSort = ref(route.query.sort || 'latest');
const currentPage = ref(route.query.page ? parseInt(route.query.page) : 1);

// Fetch category details
const fetchCategory = async () => {
  if (!categorySlug.value) return;
  const categoryData = await fetchCollection(categorySlug.value);
  if (categoryData) {
    category.value = categoryData;
  }
};

// Fetch products with pagination
const fetchCategoryProducts = async (page = 1) => {
  if (!categorySlug.value) return;
  try {
    const skip = (page - 1) * itemsPerPage;
    await loadProductsByCollections([categorySlug.value], skip, itemsPerPage);
    currentPage.value = page;
    if (page === 1) {
      totalItems.value = products.value.length;
    }
  } catch (err) {
    console.error('Error fetching products:', err);
  }
};

// Sorted products based on selected option
const sortedProducts = computed(() => {
  if (!products.value || products.value.length === 0) return [];
  const productsCopy = [...products.value];

  switch (selectedSort.value) {
    case 'price-asc':
      return productsCopy.sort((a, b) => {
        const priceA = a.variants?.[0]?.priceWithTax || 0;
        const priceB = b.variants?.[0]?.priceWithTax || 0;
        return priceA - priceB;
      });
    case 'price-desc':
      return productsCopy.sort((a, b) => {
        const priceA = a.variants?.[0]?.priceWithTax || 0;
        const priceB = b.variants?.[0]?.priceWithTax || 0;
        return priceB - priceA;
      });
    case 'name-asc':
      return productsCopy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name-desc':
      return productsCopy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'latest':
    default:
      return productsCopy;
  }
});

// Update URL query parameters without reloading route
const updateQueryParams = (newSort, newPage) => {
  router.replace({
    query: {
      ...route.query,
      sort: newSort,
      page: newPage.toString()
    }
  });
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    updateQueryParams(selectedSort.value, page);
    fetchCategoryProducts(page);
  }
};

// Watch for changes in the category slug (route param)
watch(categorySlug, (newSlug) => {
  if (newSlug) {
    fetchCategory();
    // Use query params or defaults
    const initialSort = route.query.sort || 'latest';
    const initialPage = route.query.page ? parseInt(route.query.page) : 1;
    selectedSort.value = initialSort;
    currentPage.value = initialPage;
    fetchCategoryProducts(initialPage);
  }
});

// Watch for changes in route query parameters (sort, page)
watch(() => route.query, (newQuery) => {
  const newSort = newQuery.sort || 'latest';
  const newPage = newQuery.page ? parseInt(newQuery.page) : 1;

  if (selectedSort.value !== newSort) {
    selectedSort.value = newSort;
  }

  if (currentPage.value !== newPage) {
    currentPage.value = newPage;
    fetchCategoryProducts(newPage);
  }
});

// Watch for selectedSort changes from UI and update URL query param
watch(selectedSort, (newSort) => {
  updateQueryParams(newSort, currentPage.value);
});

// Initial fetch on component mount
onMounted(() => {
  if (categorySlug.value) {
    fetchCategory();
    fetchCategoryProducts(currentPage.value);
  }
});
</script>

<template>
  <div class="max-width">
    <!-- Loading State -->
    <Spinner v-if="isLoading" size="lg" message="Loading category..."/>
    <!-- Error State -->
   <div v-else-if="error" class="error-container">
  <p class="error-message">{{ error }}</p>
   <router-link to="/" class="block">
    <Button type="primary" class="w-full">
      Back to Home
    </Button>
  </router-link>
</div>

    <!-- Category Content -->
    <div v-else-if="category && products.length > 0" class="category-content">
      <!-- Products Section -->
      <div class="products-section">
        <SectionWrapper 
          :title="category.name"
          :caption="category.description"
        >
          <template #content>
            <!-- Filter Section -->
            <div v-if="sortedProducts.length > 0" class="filter-section">
              <div class="filter-container">
                <label class="filter-label">Sort By:</label>
                <Dropdown panelDir="center" :underline="false">
                  <template #header>
                    <button class="sort-dropdown" type="button">
                      {{
                        {
                          'latest': 'Latest',
                          'price-asc': 'Price: Low to High',
                          'price-desc': 'Price: High to Low',
                          'name-asc': 'Name: A to Z',
                          'name-desc': 'Name: Z to A',
                        }[selectedSort] || 'Sort'
                      }}
                    </button>
                  </template>
                  <template #panel>
                    <ul class="sort-options">
                      <li
                        v-for="(label, key) in {
                          latest: 'Latest',
                          'price-asc': 'Price: Low to High',
                          'price-desc': 'Price: High to Low',
                          'name-asc': 'Name: A to Z',
                          'name-desc': 'Name: Z to A'
                        }"
                        :key="key"
                      >
                        <button
                          class="sort-option"
                          :class="{ selected: selectedSort === key }"
                          @click="selectedSort = key"
                          type="button"
                        >
                          {{ label }}
                        </button>
                      </li>
                    </ul>
                  </template>
                </Dropdown>
              </div>

              <div class="product-count">
                Showing {{ sortedProducts.length }} of {{ totalItems }} products
              </div>
            </div>

            <!-- Products Grid -->
            <div class="products-grid">
              <ProductCard 
                v-for="product in sortedProducts"
                :key="product.slug"
                :product="product"
              />
            </div>
          </template>
        </SectionWrapper>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>

        <div class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>

        <button 
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- No Products Found -->
    <div v-else-if="!isLoading && !error" class="no-products-container">
      <p>No products found in this category.</p>
        <router-link to="/" class="block">
    <Button type="primary" class="w-full">
      Back to Home
    </Button>
  </router-link>
    </div>
  </div>
</template>

<style scoped>

/* Loading State */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
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

.loading p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  padding: 20px;
}

.error-message {
  font-size: 18px;
  color: #d32f2f;
  margin: 0;
  text-align: center;
}

.back-link {
  padding: 10px 20px;
  background: #000;
  color: #fff;
  text-decoration: none;
  border: 2px solid #000;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-link:hover {
  background: #fff;
  color: #000;
}

/* No Products State */
.no-products-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  padding: 20px;
}

.no-products-container p {
  font-size: 18px;
  color: #666;
  margin: 0;
  text-align: center;
}

/* Category Content */
.category-content {
  width: 100%;
}

/* Products Section */
.products-section {
  padding: 40px 0;
}

/* Filter Section */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 20px;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 3px;
}

.product-count {
  padding-bottom: 3px;
}

/* Dropdown Button */
.sort-dropdown {
  color: #000;
  font-size: 14px;
  cursor: pointer;
  font-weight: bold;
}

/* Sort Options Panel */
.sort-options {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sort-option {
  display: block;
  width
: 100%;
  padding: 6px 12px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.sort-option.selected {
  font-weight: 700;
  color: #000;
  background-color: #f0f0f0;
}

/* Products Grid */
.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
  align-items: stretch;
  padding: 0 20px;
}

.products-grid > * {
  flex: 0 0 calc(25% - 15px);
  max-width: calc(25% - 15px);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px;
  border-top: 2px solid #000;
}

.pagination-btn {
  padding: 10px 20px;
  border: 2px solid #000;
  background: #fff;
  color: #000;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #000;
  color: #fff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  min-width: 150px;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 1023px) and (min-width: 769px) {
  .products-grid > * {
    flex: 0 0 calc(50% - 10px);
    max-width: calc(50% - 10px);
  }
}

@media (max-width: 768px) {
  .filter-container {
    width: 100%;
  }

  .sort-dropdown {
    width: 100%;
    min-width: unset;
  }

  .product-count {
    width: 100%;
    text-align: right;
  }

  .products-grid {
    padding: 0 16px;
    gap: 16px;
  }

  .products-grid > * {
    flex: 0 0 calc(50% - 8px);
    max-width: calc(50% - 8px);
  }
}

@media (max-width: 480px) {
  .filter-label {
    font-size: 12px;
  }

  .sort-dropdown {
    font-size: 13px;
  }

  .product-count {
    font-size: 12px;
  }

  .products-grid {
    padding: 0 12px;
    gap: 12px;
  }

  .products-grid > * {
    flex: 0 0 calc(50% - 6px);
    max-width: calc(50% - 6px);
  }
}
</style>
