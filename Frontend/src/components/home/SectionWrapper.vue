<script setup>
const props = defineProps({
    'title': {
        type: String,
        default: ''
    },
    'caption': {
        type: String,
        default: ''
    }
})
</script>

<template>
    <section class="section space-y-4">
        <div class="section-header">
            <h1 class="section-heading secondary-font">{{ title }}</h1>
            <p class="section-caption" v-html="caption"></p>
        </div>
        <slot name="content">
        </slot>
    </section>
</template>

<style scoped>
.section {
    max-width: var(--global-max-width);
    margin: auto;
}

.section-heading {
    text-align: center;
    color: #000;
    font-size: 2.67rem;
    text-transform: uppercase;
    margin-top: 1rem;
}

.section-caption {
    text-align: center;
    color: #000;
    font-size: 1.67rem;
    text-transform: uppercase;
}

/* Responsive */
@media (max-width: 768px) {
    .section-caption {
        font-size: 1.47rem;
    }
}

@media (max-width: 480px) {
  .product-image-container {
    aspect-ratio: var(--product-card-small-mobile-aspect-ratio);
  }
  
  .product-info {
    padding: 10px;
  }
  
  .product-actions {
    padding: 0 10px 10px;
  }
}

</style>