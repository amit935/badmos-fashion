// store/currencyStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCurrencyStore = defineStore('currency', () => {
  const currency = ref({
    code: 'INR',
    symbol: '₹',
    decimalPlaces: 2,
    locale: 'en-IN'
  });

  return { currency };
});
