<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// Props
const props = defineProps({
  assets: {
    type: Array,
    required: true,
    validator: arr => arr.length > 0 && arr.every(a => a.preview)
  },
  autoPlay: { type: Boolean, default: true },
  autoPlayInterval: { type: Number, default: 2000, validator: v => v >= 1000 },
  transitionDuration: { type: Number, default: 0, validator: v => v >= 100 },
  showDots: { type: Boolean, default: true },
  pauseOnHover: { type: Boolean, default: true },
  height: { type: String, default: '900px' },
  objectFit: { type: String, default: 'cover', validator: v => ['cover','contain','fill','scale-down','none'].includes(v) }
})

// Reactive state
const currentIndex = ref(0)
const incomingIndex = ref(null)
const interval = ref(null)
const isTransitioning = ref(false)
const isLoading = ref(true)
const loadedImages = ref(new Set())
const errorImages = ref(new Set())

const hoverLeft = ref(false)
const hoverRight = ref(false)

const totalImages = computed(() => props.assets.length)

// Transition logic
const startTransition = (newIndex) => {
  if (isTransitioning.value || totalImages.value <= 1) return
  isTransitioning.value = true
  incomingIndex.value = newIndex
  setTimeout(() => {
    currentIndex.value = incomingIndex.value
    incomingIndex.value = null
    isTransitioning.value = false
  }, props.transitionDuration + 100)
}

// Autoplay control
const startCarousel = () => {
  if (interval.value) clearInterval(interval.value)
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

const restartCarousel = () => {
  if (props.autoPlay) {
    stopCarousel()
    startCarousel()
  }
}

// Manual navigation handlers
const nextImage = () => {
  const newIndex = (currentIndex.value + 1) % totalImages.value
  startTransition(newIndex)
  restartCarousel()
}

const previousImage = () => {
  const newIndex = currentIndex.value === 0 ? totalImages.value - 1 : currentIndex.value - 1
  startTransition(newIndex)
  restartCarousel()
}

const goToSlide = (index) => {
  if (index === currentIndex.value) return
  startTransition(index)
  restartCarousel()
}

// Image class helper
const getImageClass = (index) => {
  const classes = []
  if (index === currentIndex.value) classes.push('current')
  if (index === incomingIndex.value) classes.push('incoming')
  if (errorImages.value.has(index)) classes.push('error')
  if (!loadedImages.value.has(index)) classes.push('loading')
  return classes.join(' ')
}

// Image load/error handlers
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

// Pause on hover handlers
const handleMouseEnter = () => {
  if (props.pauseOnHover) stopCarousel()
}

const handleMouseLeave = () => {
  if (props.pauseOnHover && props.autoPlay) startCarousel()
}

// Swipe handlers 
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

onMounted(() => {
  if (props.autoPlay && totalImages.value > 1) startCarousel()
})

onBeforeUnmount(() => {
  stopCarousel()
})
</script>

<template>
  <section
    class="product-image-carousel"
    :style="{ height: height }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <img
      v-for="(asset, index) in props.assets"
      :key="asset.id || index"
      :src="asset.preview"
      :alt="asset.alt || `Product image ${index + 1}`"
      :class="getImageClass(index)"
      @load="handleImageLoad"
      @error="handleImageError"
      loading="lazy"
      :style="{ objectFit: props.objectFit, height: '100%', width: '100%' }"
    />

    <!-- Left clickable half -->
    <div
      class="click-area left"
      @click="previousImage"
      @mouseenter="hoverLeft = true"
      @mouseleave="hoverLeft = false"
    >
      
    </div>

    <!-- Right clickable half -->
    <div
      class="click-area right"
      @click="nextImage"
      @mouseenter="hoverRight = true"
      @mouseleave="hoverRight = false"
    >
   
    </div>

    <!-- Navigation dots -->
    <div v-if="showDots && totalImages > 1" class="carousel-dots">
      <button
        v-for="(asset, index) in props.assets"
        :key="`dot-${index}`"
        :class="['dot', { active: index === currentIndex }]"
        @click="goToSlide(index)"
        :aria-label="`Go to slide ${index + 1}`"
      />
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
    </div>
  </section>
</template>

<style scoped>
.product-image-carousel {
  position: relative;
  overflow: hidden;
  background: #000;
  user-select: none;
  width: 100%;
}

.product-image-carousel img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.product-image-carousel img.loading,
.product-image-carousel img.error {
  opacity: 0;
  background: repeating-conic-gradient(#f0f0f0 0 25%, transparent 0 50%);
}

.product-image-carousel img.incoming {
  clip-path: inset(0 100% 0 0);
  z-index: 2;
  animation: uncoverRightToLeft var(--transition-duration) forwards;
}

.product-image-carousel img.current {
  z-index: 1;
}

/* Clickable halves covering left and right */
.click-area {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  cursor: pointer;
  z-index: 20;
  display: flex;
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

/* Loading indicator */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
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
</style>
