<script setup>
import Footer from '../components/footer/Footer.vue';
import Header from '../components/header/Header.vue';

</script>

<template>
    <Header />
    <main>
        <slot name="main">
        </slot>
    </main>
    <Footer />
</template>