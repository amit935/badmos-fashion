// composables/usePriceFormatter.js
import { useCurrencyStore } from '../store/currencyStore';

export function usePriceFormatter() {
  const currencyStore = useCurrencyStore();

  const formatPrice = (amountInSmallestUnit) => {
    const { code, decimalPlaces, locale } = currencyStore.currency;
    const amount = amountInSmallestUnit / Math.pow(10, decimalPlaces);
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  };

  return { formatPrice };
}
