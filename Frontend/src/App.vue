<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Header from './components/header/Header.vue';
import Footer from './components/footer/Footer.vue';

const route = useRoute()

const showHeader = computed(() => !route.meta.hideHeader)
const showFooter = computed(() => !route.meta.hideFooter)
</script>

<template>
     <Header v-if="showHeader" />
     <router-view />
     <Footer v-if="showFooter" />
</template>