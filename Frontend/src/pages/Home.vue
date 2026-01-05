<script setup>
import { ref, onMounted } from 'vue';
import HeroImageSlider from '../components/carousel/HeroImageSlider.vue';
import ProductList from '../components/home/section/ProductList.vue';
import { useQueryCollection } from '../composables/useQueryCollection.js';

const { fetchCollection } = useQueryCollection();

const sections = ref([]);
  
onMounted(async () => {
  try {
    const collectionData = await fetchCollection('home');
        console.log('Sections after processing:', collectionData);  
    const children = collectionData.children || [];
    
    sections.value = children.map(section => {
      console.log('Processing section:', section.componentName);
      let component = null;
      let props = {};

      switch (section.customFields.componentName.replace(/\s+/g, '')) {
        
        case 'HeroImageSlider':
         
          const collections = (section.children || []).map(child => {
            return {
              slug: child.slug,
              assets: child.assets && child.assets.length > 0
                ? child.assets.map(asset => ({
                    id: asset.id,
                    preview: asset.preview,
                    name: asset.name || ''
                  }))
                : []
            };
          });


          component = HeroImageSlider;
          props = { collections };
          break;

      case 'ProductList':
        component = ProductList;
        props = { 
          title: section?.name, 
          caption: section?.description || '',
          categorySlugs: section?.slug ? [section.slug] : []
        };
        break;

      default:
        break;
      }

      return {
        id: section.id,
        component,
        props,
      };
    }).filter(section => section.component !== null);
 

  } catch (err) {
    console.error('Error fetching home sections data:', err);
  }
});
  setTimeout(() => {
    console.log('Sections after processing:', sections.value);  
  }, 2000);
</script>


<template>
  <div>
    <component
      v-for="section in sections"
      :key="section.id"
      :is="section.component"
      v-bind="section.props"
      class="mt-8 mb-8"
    />
  </div>
</template>
