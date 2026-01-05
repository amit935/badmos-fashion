<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

// Props
const props = defineProps({
  collections: {
    type: Array,
    required: true,
    validator: (collections) => {
      return collections.length > 0 && collections.every(col => 
        col.slug && col.assets && Array.isArray(col.assets)
      );
    }
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  autoPlayInterval: {
    type: Number,
    default: 5000,
    validator: (value) => value >= 1000
  },
  transitionDuration: {
    type: Number,
    default: 1000,
    validator: (value) => value >= 100
  },
  showDots: {
    type: Boolean,
    default: true
  },
  showArrows: {
    type: Boolean,
    default: true
  },
  pauseOnHover: {
    type: Boolean,
    default: true
  },
  height: {
    type: String,
    default: 'calc(80vh - 88px)'
  },
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain', 'fill', 'scale-down', 'none'].includes(value)
  }
})

console.log(props.collections)

// Reactive data
const hoverLeft = ref(false)
const hoverRight = ref(false)
const currentIndex = ref(0)
const incomingIndex = ref(null)
const interval = ref(null)
const isTransitioning = ref(false)
const isLoading = ref(true)
const loadedImages = ref(new Set())
const errorImages = ref(new Set())
const carouselContainer = ref(null)
const currentBreakpoint = ref('desktop') // 'desktop', 'tablet', or 'mobile'

// Computed properties
const currentImages = computed(() => {
  let collectionSlug = '1920x1080' // default desktop
  
  if (currentBreakpoint.value === 'mobile') {
    collectionSlug = '1080x2048'
  } else if (currentBreakpoint.value === 'tablet') {
    collectionSlug = '1080x1280'
  }
  
  const collection = props.collections.find(col => col.slug === collectionSlug)
  return collection && collection.assets.length > 0 ? collection.assets : []
})

const totalImages = computed(() => currentImages.value.length)
const hasValidImages = computed(() => currentImages.value.length > 0 && errorImages.value.size < currentImages.value.length)

// Breakpoint detection
const updateBreakpoint = () => {
  const width = window.innerWidth
  
  if (width <= 480) {
    currentBreakpoint.value = 'mobile'
  } else if (width <= 768) {
    currentBreakpoint.value = 'tablet'
  } else {
    currentBreakpoint.value = 'desktop'
  }
}

// Watch for breakpoint changes and reset carousel
watch(currentBreakpoint, () => {
  currentIndex.value = 0
  incomingIndex.value = null
  isTransitioning.value = false
  loadedImages.value.clear()
  errorImages.value.clear()
  
  if (props.autoPlay && totalImages.value > 1) {
    startCarousel()
  }
})

// Methods
const initializeCarousel = () => {
  updateBreakpoint()
  
  if (props.autoPlay && totalImages.value > 1) {
    startCarousel()
  }
  isLoading.value = false
}

const startCarousel = () => {
  if (interval.value) {
    clearInterval(interval.value)
  }
  interval.value = setInterval(() => {
    if (!isTransitioning.value) {
      nextImage()
    }
  }, props.autoPlayInterval)
}

const stopCarousel = () => {
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
}

const nextImage = () => {
  if (isTransitioning.value || totalImages.value <= 1) return;

  isTransitioning.value = true;
  incomingIndex.value = (currentIndex.value + 1) % totalImages.value;

  // Safety fallback: reset isTransitioning after transitionDuration plus small buffer
  setTimeout(() => {
    if (isTransitioning.value) {
      isTransitioning.value = false;
      currentIndex.value = incomingIndex.value;
      incomingIndex.value = null;
    }
  }, props.transitionDuration + 100);
};


const previousImage = () => {
  if (isTransitioning.value || totalImages.value <= 1) return
  
  isTransitioning.value = true
  incomingIndex.value = currentIndex.value === 0 ? totalImages.value - 1 : currentIndex.value - 1
}

const goToSlide = (index) => {
  if (isTransitioning.value || index === currentIndex.value || index < 0 || index >= totalImages.value) return
  
  isTransitioning.value = true
  incomingIndex.value = index
}

const getImageClass = (index) => {
  const classes = []
  
  if (index === currentIndex.value) {
    classes.push('current')
  }
  if (index === incomingIndex.value) {
    classes.push('incoming')
  }
  if (errorImages.value.has(index)) {
    classes.push('error')
  }
  if (!loadedImages.value.has(index)) {
    classes.push('loading')
  }
  
  return classes.join(' ')
}

const handleAnimationEnd = (index) => {
  if (index === incomingIndex.value) {
    currentIndex.value = incomingIndex.value
    incomingIndex.value = null
    isTransitioning.value = false
  }
}

const handleImageLoad = (event) => {
  const index = Array.from(event.target.parentNode.children).indexOf(event.target)
  loadedImages.value.add(index)
  
  if (loadedImages.value.size === totalImages.value) {
    isLoading.value = false
  }
}

const handleImageError = (event) => {
  const index = Array.from(event.target.parentNode.children).indexOf(event.target)
  errorImages.value.add(index)
  console.warn(`Failed to load image at index ${index}`)
}

const preloadImages = () => {
  currentImages.value.forEach((image, index) => {
    const img = new Image()
    img.onload = () => loadedImages.value.add(index)
    img.onerror = () => errorImages.value.add(index)
    img.src = image.preview
  })
}

const handleMouseEnter = () => {
  if (props.pauseOnHover) {
    stopCarousel()
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover && props.autoPlay) {
    startCarousel()
  }
}

const startX = ref(null)
const startY = ref(null)
const threshold = 50
const restraint = 100

const handleTouchStart = (event) => {
  const touch = event.changedTouches[0]
  startX.value = touch.pageX
  startY.value = touch.pageY
}

const handleTouchEnd = (event) => {
  if (startX.value === null || startY.value === null) return
  const touch = event.changedTouches[0]
  const distX = touch.pageX - startX.value
  const distY = touch.pageY - startY.value
  if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
    if (distX > 0) {
      previousImage()
    } else {
      nextImage()
    }
  }
  startX.value = null
  startY.value = null
}


const cleanup = () => {
  stopCarousel()
  window.removeEventListener('resize', updateBreakpoint)
}

const getImageAlt = (image, index) => {
  return image.alt || `Hero image ${index + 1}`
}

// Lifecycle
onMounted(() => {
  initializeCarousel()
  preloadImages()
  window.addEventListener('resize', updateBreakpoint)
  
  if (carouselContainer.value && props.pauseOnHover) {
    carouselContainer.value.addEventListener('mouseenter', handleMouseEnter)
    carouselContainer.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>
<template>
  <section class="hero-carousel" ref="carouselContainer"  @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd">
    <Spinner v-if="isLoading" size="lg" message="Loading..." />
    <img
      v-for="(image, index) in currentImages"
      :key="`hero-image-${index}`"
      :src="image.preview"
      :alt="getImageAlt(image, index)"
      :class="getImageClass(index)"
      @animationend="handleAnimationEnd(index)"
      @load="handleImageLoad"
      @error="handleImageError"
      loading="lazy"
    />
    
    <!-- Navigation dots -->
    <div v-if="showDots && currentImages.length > 1" class="carousel-dots">
      <button
        v-for="(image, index) in currentImages"
        :key="`dot-${index}`"
        :class="['dot', { active: index === currentIndex }]"
        @click="goToSlide(index)"
        :aria-label="`Go to slide ${index + 1}`"
      />
    </div>
    
    <!-- Clickable left half for previous -->
<div
  class="click-area left"
  @click="previousImage"
  @mouseenter="hoverLeft = true"
  @mouseleave="hoverLeft = false"
>
  
</div>

<!-- Clickable right half for next -->
<div
  class="click-area right"
  @click="nextImage"
  @mouseenter="hoverRight = true"
  @mouseleave="hoverRight = false"
>
  
</div>
  </section>
</template>
<style scoped>
.hero-carousel {
  position: relative;
  width: 100%;
  max-width: 100vw;
  aspect-ratio: 1920 / 1080;
  overflow: hidden;
  margin: auto;
  background: #000;
  user-select: none;
}

.hero-carousel img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.hero-carousel img.loading {
  opacity: 0;
}

.hero-carousel img.error {
  opacity: 0;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.hero-carousel img.incoming {
  clip-path: inset(0 100% 0 0);
  z-index: 2;
  animation: uncoverRightToLeft v-bind(transitionDuration + 'ms') forwards;
}

.hero-carousel img.current {
  z-index: 1;
}

/* Navigation dots */
.carousel-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot:hover {
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.dot.active {
  background: white;
  border-color: white;
}

/* Navigation arrows */
.click-area {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  z-index: 20;
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  user-select: none;
  background: transparent;
}

.click-area.left {
  left: 0;
  cursor: var(--cursor-left);
}

.click-area.right {
  right: 0;
  cursor: var(--cursor-right);
}

/* Loading indicator */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes uncoverRightToLeft {
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .hero-carousel {
    aspect-ratio: 1080/1280;
  }
  
  .carousel-arrows {
    padding: 0 10px;
  }
  
  .arrow {
    width: 40px;
    height: 40px;
  }
  
  .arrow svg {
    width: 16px;
    height: 16px;
  }
  
  .dot {
    width: 10px;
    height: 10px;
  }
}

@media (max-width: 480px) {
  .hero-carousel {
    aspect-ratio: 1080 / 2048;
  }
  
  .carousel-dots {
    bottom: 10px;
  }
  
  .carousel-arrows {
    padding: 0 5px;
  }
  
  .arrow {
    width: 35px;
    height: 35px;
  }
}
</style>
