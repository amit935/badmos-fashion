<script setup>
import { ref, onMounted } from 'vue';
import { useQueryCollection } from '../../../composables/useQueryCollection.js';

const { fetchCollection } = useQueryCollection();

const shopByCategory = ref('Shop By Categories');
const shopByCollection = ref('Shop By Collections');

const categories = ref([]);
const collections = ref([]);

// Track which sections are open
const isCategoryOpen = ref(false);
const isCollectionOpen = ref(false);

// Track which individual items are expanded
const expandedCategories = ref(new Set());
const expandedCollections = ref(new Set());

const toggleCategory = () => {
  isCategoryOpen.value = !isCategoryOpen.value;
};

const toggleCollection = () => {
  isCollectionOpen.value = !isCollectionOpen.value;
};

const toggleCategoryItem = (slug) => {
  if (expandedCategories.value.has(slug)) {
    expandedCategories.value.delete(slug);
  } else {
    expandedCategories.value.add(slug);
  }
};

const toggleCollectionItem = (slug) => {
  if (expandedCollections.value.has(slug)) {
    expandedCollections.value.delete(slug);
  } else {
    expandedCollections.value.add(slug);
  }
};

onMounted(async () => {
  try {
    shopByCategory.value = await fetchCollection('shop-by-categories');
    shopByCollection.value = await fetchCollection('shop-by-collections');
    categories.value = await fetchCollection('categories');
    collections.value = await fetchCollection('collections');
  } catch (err) {
    console.error('Error fetching navigation data:', err);
  }
});

const props = defineProps({
  toggleMenu: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['toggleMenu'])
</script>

<template>
    <button 
        @click="emit('toggleMenu')" 
        class="p-1 absolute top-0 left-0 m-10 text-gray-400 hover:text-red-600 transition-colors"
        aria-label="Close cart"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
  <nav>
    <ul class="flex flex-col gap-4 p-4">
      <!-- Shop By Categories -->
      <li>
        <div>
          <button 
            @click="toggleCategory" 
            class="font-bold uppercase flex items-center justify-between w-full py-2"
          >
            <span>{{ shopByCategory?.name }}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 transition-transform"
              :class="{ 'rotate-180': isCategoryOpen }"
              fill="none" 
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-show="isCategoryOpen" class="mt-2 ml-4">
            <div
              v-for="category in categories?.children"
              :key="category.name + (category.slug || '')"
              class="flex flex-col mb-3"
            >
              <a
                :href="`/${category.slug}`"
                class="text-lg font-semibold py-2 hover:text-gray-600"
              >
                {{ category.name }}
              </a>

              <div v-if="category.children && category.children.length > 0">
                <div
                  v-for="childCategory in category.children"
                  :key="childCategory.name + (childCategory.slug || '')"
                  class="ml-4"
                >
                  <button
                    v-if="childCategory.children && childCategory.children.length > 0"
                    @click="toggleCategoryItem(childCategory.slug)"
                    class="flex items-center justify-between w-full text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    <span>{{ childCategory.name }}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-4 w-4 transition-transform"
                      :class="{ 'rotate-180': expandedCategories.has(childCategory.slug) }"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <a
                    v-else
                    :href="`/${childCategory.slug}`"
                    class="block text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    {{ childCategory.name }}
                  </a>

                  <div 
                    v-if="childCategory.children && expandedCategories.has(childCategory.slug)"
                    class="ml-4"
                  >
                    <a
                      v-for="grandChildCategory in childCategory.children"
                      :key="grandChildCategory.name + (grandChildCategory.slug || '')"
                      :href="`/${grandChildCategory.slug}`"
                      class="block text-gray-700 text-lg font-normal py-1 hover:text-gray-600"
                    >
                      {{ grandChildCategory.name }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>

      <!-- Shop By Collections -->
      <li>
        <div>
          <button 
            @click="toggleCollection" 
            class="font-bold uppercase flex items-center justify-between w-full py-2"
          >
            <span>{{ shopByCollection?.name }}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 transition-transform"
              :class="{ 'rotate-180': isCollectionOpen }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-show="isCollectionOpen" class="mt-2 ml-4">
            <div
              v-for="collection in collections?.children"
              :key="collection.name + (collection.slug || '')"
              class="flex flex-col mb-3"
            >
              <a
                :href="`/${collection.slug}`"
                class="text-lg font-semibold py-2 hover:text-gray-600"
              >
                {{ collection.name }}
              </a>

              <div v-if="collection.children && collection.children.length > 0">
                <div
                  v-for="childCollection in collection.children"
                  :key="childCollection.name + (childCollection.slug || '')"
                  class="ml-4"
                >
                  <button
                    v-if="childCollection.children && childCollection.children.length > 0"
                    @click="toggleCollectionItem(childCollection.slug)"
                    class="flex items-center justify-between w-full text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    <span>{{ childCollection.name }}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-4 w-4 transition-transform"
                      :class="{ 'rotate-180': expandedCollections.has(childCollection.slug) }"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <a
                    v-else
                    :href="`/${childCollection.slug}`"
                    class="block text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    {{ childCollection.name }}
                  </a>

                  <div 
                    v-if="childCollection.children && expandedCollections.has(childCollection.slug)"
                    class="ml-4"
                  >
                    <a
                      v-for="grandChildCollection in childCollection.children"
                      :key="grandChildCollection.name + (grandChildCollection.slug || '')"
                      :href="`/${grandChildCollection.slug}`"
                      class="block text-gray-700 text-lg font-normal py-1 hover:text-gray-600"
                    >
                      {{ grandChildCollection.name }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
button {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s ease;
}

svg {
  flex-shrink: 0;
}
</style>
