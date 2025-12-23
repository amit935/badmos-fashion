<script setup>
import Dropdown from '../../ui/Dropdown.vue'
import { useQueryCollection } from '../../../composables/useQueryCollection.js'
import { useSignout } from '../../../composables/useSignout.js'
import { useAuthStore } from '../../../store/authStore'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from '../../ui/Button.vue'
import CartPanel from '../../cart/CartPanel.vue'

const { isAuthenticated } = useAuthStore()
const { signOut } = useSignout()
const { fetchCollection } = useQueryCollection()
const router = useRouter()
const { t } = useI18n()

const userLinks = ref([])



const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const signOutAndRedirect = async () => {
  try {
    await signOut();
    // Redirect using native browser navigation
    window.location.href = '/';
  } catch (error) {
    console.error('Error during sign out:', error);
  }
};


onMounted(async () => {
  try {
    userLinks.value = await fetchCollection('user')
  } catch (err) {
    console.error('Error fetching user links data:', err);
  }

});


const menuOpen = ref(false);
const toggleMenu = () => { menuOpen.value = !menuOpen.value; };
</script>

<template>
    <nav>
        <ul class="flex gap-6">
            <li>
              <button 
                @click="toggleMenu" 
                class="h-full px-2 py-1 flex items-center border-b-3 border-transparent cursor-pointer"
                aria-label="Toggle menu"
              >
                <span class="material-symbols-outlined">
                  shopping_bag
                </span>
              </button>
              <div 
                v-if="menuOpen"
                :toggleMenu="toggleMenu"
                class="fixed h-[100vh] w-[100%] md:w-[35%] top-0 right-0 bg-white z-20 pt-10 px-8 border-l-2 border-black"
              >
                <CartPanel @toggleMenu="toggleMenu"/>
              </div>
            </li>
            <li>
                <Dropdown panelDir="right">
                    <template #header>
                        <span class="material-symbols-outlined">
                        person
                        </span>
                    </template>
                    <template #panel>
                        <div v-if="isAuthenticated">
                            <div v-for="userLink in userLinks?.children">
                                <a
                                    :href="`${userLink.customFields.externalLink}`"
                                    class="block text-base font-semibold text-center py-1"
                                >
                                    {{ userLink.name }}
                                </a>
                            </div>
                            <a
                                @click.prevent="signOutAndRedirect()"
                                href="#"
                                class="block text-base font-semibold text-center py-1"
                            >
                                Sign Out
                            </a>
                        </div>
                        <div v-else class="flex flex-col gap-2 p-6">
                            <h1 class="text-3xl text-center font-bold secondary-font">{{ t('guest.profileDropdown.title') }}</h1>
                            <div class="flex space-x-4">
                                <Button @click="goToLogin" :text="t('auth.login.altTitle')"/>
                                <Button category="secondary" @click="goToRegister" :text="t('auth.register.altTitle')"/>
                            </div>
                        </div>
                    </template>
                </Dropdown>
            </li>

        </ul>
    </nav>
</template>