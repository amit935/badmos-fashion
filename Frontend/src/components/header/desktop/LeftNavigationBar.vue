<script setup>
import Dropdown from '../../ui/Dropdown.vue';
import { useQueryCollection } from '../../../composables/useQueryCollection.js'
import { ref, onMounted } from 'vue';

const { fetchCollection } = useQueryCollection()


const shopByCategory = ref('Shop By Categories');
const shopByCollection = ref('Shop By Collections');

const categories = ref([])
const collections = ref([])

onMounted(async () => {
  try {
    shopByCategory.value = await fetchCollection('shop-by-categories')
    shopByCollection.value = await fetchCollection('shop-by-collections')
    categories.value = await fetchCollection('categories');
    collections.value = await fetchCollection('collections');
  } catch (err) {
    console.error('Error fetching navigation data:', err);
  }

});

</script>

<template>
    <nav>
        <ul class="flex gap-6">
            <li>
                <Dropdown panelDir="center">
                    <template #header>
                        <p class="font-bold uppercase flex items-center">{{ shopByCategory?.name }}</p>
                    </template>
                    <template #panel>
                        <div class="flex flex-wrap items-start justify-center py-8 gap-y-4">
                            <div
                            v-for="category in categories?.children"
                            :key="category.name + (category.slug || '')"
                            class="min-w-[144px] flex flex-col items-center justify-center gap-y-2"
                            >
                            <a
                                :href="`/${category.slug}`"
                                class="text-lg font-semibold text-center"
                            >
                                {{ category.name }}
                            </a>

                            <div
                                v-if="category.children"
                                v-for="childCategory in category.children"
                                :key="childCategory.name + (childCategory.slug || '')"
                                class="flex flex-col gap-y-2 items-center"
                            >
                                <a
                                :href="`/${childCategory.slug}`"
                                class="text-gray-800 text-base font-medium text-center"
                                >
                                {{ childCategory.name }}
                                </a>

                                <div
                                v-if="childCategory.children"
                                v-for="grandChildCategory in childCategory.children"
                                :key="grandChildCategory.name + (grandChildCategory.slug || '')"
                                class="flex flex-col gap-y-1 items-center"
                                >
                                <a
                                    :href="`/${grandChildCategory.slug}`"
                                    class="text-gray-700 text-sm font-normal text-center"
                                >
                                    {{ grandChildCategory.name }}
                                </a>
                                </div>
                            </div>
                            </div>
                        </div>
                        </template>

                </Dropdown>
            </li>
            <li>
                <Dropdown panelDir="center">
  <template #header>
    <p class="font-bold uppercase">{{ shopByCollection?.name }}</p>
  </template>
  <template #panel>
    <div class="flex flex-wrap items-start justify-center py-8 gap-y-4">
      <div
        v-for="collection in collections?.children"
        :key="collection.name + (collection.slug || '')"
        class="min-w-[144px] flex flex-col items-center justify-center gap-y-2"
      >
        <a
          :href="`/${collection.slug}`"
          class="text-lg font-semibold text-center"
        >
          {{ collection.name }}
        </a>

        <div
          v-if="collection.children"
          v-for="childCollection in collection.children"
          :key="childCollection.name + (childCollection.slug || '')"
          class="flex flex-col gap-y-2 items-center"
        >
          <a
            :href="`/${childCollection.slug}`"
            class="text-gray-800 text-base font-medium text-center"
          >
            {{ childCollection.name }}
          </a>

          <div
            v-if="childCollection.children"
            v-for="grandChildCollection in childCollection.children"
            :key="grandChildCollection.name + (grandChildCollection.slug || '')"
            class="flex flex-col gap-y-1 items-center"
          >
            <a
              :href="`/${grandChildCollection.slug}`"
              class="text-gray-700 text-sm font-normal text-center"
            >
              {{ grandChildCollection.name }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </template>
</Dropdown>

            </li>
        </ul>
    </nav>
</template>