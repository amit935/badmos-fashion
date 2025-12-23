<script setup>
import { ref } from 'vue';
import AppLogo from '../ui/AppLogo.vue'
import LeftNavigationBar from './desktop/LeftNavigationBar.vue';
import LeftNavigationPanel from '../header/mobile/LeftNavigationPanel.vue';
import RightNavigationBar from './desktop/RightNavigationBar.vue';

const menuOpen = ref(false);
const toggleMenu = () => { menuOpen.value = !menuOpen.value; };
</script>

<template>
  <header class="sticky top-0 z-999  bg-white">
    <div class="max-width  flex justify-between items-center h-28 px-6 h-[7rem] ">

    <button 
      @click="toggleMenu" 
      class="md:hidden flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200"
      aria-label="Toggle menu"
    >
      <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- Desktop left section: Logo and LeftNavigationBar as before -->
    <div class="flex items-center gap-12">
      <router-link to="/">
        <AppLogo width="128" />
      </router-link>
      <LeftNavigationBar class="hidden md:flex" />
    </div>

    <!-- Right navigation always visible -->
    <RightNavigationBar />

    <!-- Mobile menu dropdown (LeftNavigationBar) only shown if menuOpen -->
    <div 
      v-if="menuOpen"
      :toggleMenu="toggleMenu"
      class="fixed h-[100vh] w-[75%] top-0 left-0 bg-white md:hidden z-20 pt-28 px-8 border-r-2 border-black"
    >

      <LeftNavigationPanel @toggleMenu="toggleMenu"/>
    </div>
    </div>
  </header>
</template>
