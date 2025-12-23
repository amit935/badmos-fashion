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
        <div class="text-lg p-12" v-html="collectionData?.description"></div>
        <div v-if="isLoading">Loading...</div>
        <div v-if="error">Error: {{ error.message }}</div>
    </div>
</template>