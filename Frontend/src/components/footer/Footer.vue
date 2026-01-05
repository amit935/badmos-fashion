<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQueryCollection } from '../../composables/useQueryCollection';

const route = useRoute();
const currentYear = new Date().getFullYear();

const { fetchCollection, isLoading, error } = useQueryCollection();

const tagline = ref(null);
const socialLinks = ref(null);
const footer = ref(null);
const about = ref(null);
const copyright = ref(null);

const shouldHideFooter = computed(() => {
  const hideRoutes = ['/login', '/register'];
  return hideRoutes.includes(route.path);
});

onMounted(async () => {
  try {
    tagline.value = await fetchCollection('tagline');
    socialLinks.value = await fetchCollection('social-media-links');
    footer.value = await fetchCollection('footer');
    about.value = await fetchCollection('about');
    copyright.value = await fetchCollection('copyright');
  } catch (err) {
    console.error('Error fetching footer data:', err);
  }
});
</script>

<template>
  <footer v-if="!shouldHideFooter" class="footer">
    <!-- Tagline Section -->
    <div class="max-width text-center py-10 space-y-6 border-t border-gray-200">
      <p class="secondary-font text-4xl font-bold" v-html="tagline?.description"></p>
      <div class="flex justify-center space-x-8">
        <div v-for="(socialLink, index) in socialLinks?.children"
          :key="socialLink.id || index"
        >
            <a :href="socialLink.customFields.externalLink" target="_blank" class="social-icon" aria-label="Instagram">
              <img :src="socialLink.featuredAsset.preview" :alt="socialLink.name" class="w-6"/>
            </a>
        </div>
      </div>
    </div>

    <!-- Links Section -->
    <div v-if="footer" class="max-width flex flex-wrap gap-6 px-5 py-10 mx-auto border-t border-gray-200">
      <div 
        v-for="(column, index) in footer.children" 
        :key="column.id || index" 
        class="footer-column flex-1 text-center min-w-[180px]"
      >
        <h3 class="font-bold uppercase">{{ column.name }}</h3>
        <ul class="links-list">
          <li v-for="item in column.children || []" :key="item.id">
            <a v-if="item.customFields?.externalLink" :href="item.customFields.externalLink">
              {{ item.name }}
            </a>
            <router-link v-else :to="`/${item.slug}`">
              {{ item.name }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- About Section -->
    <div class="max-width about-section mx-auto px-5 border-t border-b border-gray-200 py-10 text-center">
      <h3 class="text-lg font-bold mb-4 uppercase">{{ about?.name }}</h3>
      <p class="about-text text-gray-600 mx-auto leading-relaxed" v-html="about?.description">
      </p>
    </div>

    <!-- Copyright Section -->
    <div class="max-width text-center py-5">
      <p class="text-gray-500 text-sm" v-html="copyright?.description"></p>
    </div>
  </footer>
</template>

