<script setup>
import { useQueryCollection } from '../composables/useQueryCollection';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const { fetchCollection, isLoading, error } = useQueryCollection();
const route = useRoute();

const mpSlug = computed(() => route.params.multiPurposeSlug);
const collectionData = ref(null);

const loadCollection = async () => {
    if (!mpSlug.value) return;
    const data = await fetchCollection(mpSlug.value);
    if (data) {
        collectionData.value = data;
    }
}

onMounted(() => {
    if (mpSlug.value) {
        loadCollection();
    }
})
</script>

<template>
    <div class="max-width">
        <h1 class="secondary-font text-center text-5xl">{{ collectionData?.name }}</h1>
        <div class="rich-text text-lg p-12" v-html="collectionData?.description"></div>
        <div v-if="isLoading">Loading...</div>
        <div v-if="error">Error: {{ error.message }}</div>
    </div>
</template>

<style scoped>
.rich-text :deep(p) {
  margin: 0 0 1rem 0;
  line-height: 1.625;
}
.rich-text :deep(p:last-child) {
  margin-bottom: 0;
}
.rich-text :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}
.rich-text :deep(li) {
  margin-bottom: 0.5rem;
}
.rich-text :deep(br) {
  line-height: 1.625;
}
</style>
