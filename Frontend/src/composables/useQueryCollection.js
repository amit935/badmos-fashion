import { ref } from 'vue';
import client from '../api/client';
import { GET_COLLECTION_BY_SLUG } from '../api/queries';

export function useQueryCollection() {
  const isLoading = ref(false);
  const error = ref('');
  const cache = {};

  const fetchCollection = async (slug) => {
    if (!slug) {
      error.value = 'Slug is required';
      return null;
    }
    if (cache[slug]) {
      return cache[slug];
    }

    isLoading.value = true;
    error.value = '';

    try {
      const response = await client.request(GET_COLLECTION_BY_SLUG, { slug });

      if (response.collection && response.collection.id) {
        cache[slug] = response.collection;
        return response.collection;
      } else {
        error.value = 'Requested content not found.';
        return null;
      }
    } catch (err) {
      error.value = err.message || String(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fetchCollection,
    isLoading,
    error,
  };
}
