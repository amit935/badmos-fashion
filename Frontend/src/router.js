import { createWebHistory, createRouter } from 'vue-router'
import { watch } from 'vue'

// Page components
import HomeView from './pages/Home.vue'
import LoginView from './pages/Login.vue'
import RegisterView from './pages/Register.vue'
import ProfileView from './pages/Profile.vue'
import CategoryView from './pages/Category.vue'
import ProductDetailView from './pages/ProductDetail.vue'
import CheckoutView from './pages/Checkout.vue'
import OrderSuccessView from './pages/OrderSuccess.vue'
import MyOrderView from './pages/MyOrder.vue'
import OrderDetail from './pages/OrderDetail.vue'
import MultiPurposeView from './pages/MultiPurpose.vue'
import PageNotFoundView from './pages/PageNotFound.vue'
import VerifyEmail from './pages/VerifyEmail.vue'

// API & Store
import client from './api/client'
import { GET_COLLECTION_BY_SLUG, GET_PRODUCT_BY_SLUG } from './api/queries'
import { useAuthStore } from './store/authStore'
import ResetPassword from './pages/ResetPassword.vue'

// ============================================================================
// ROUTE TITLE CACHE (Persists meta titles across query param changes)
// ============================================================================

const routeTitleCache = new Map()

/**
 * Stores the title for a route name and param combination
 */
function cacheRouteTitle(routeName, slug, title) {
  const cacheKey = `${routeName}:${slug}`
  routeTitleCache.set(cacheKey, title)
}

/**
 * Retrieves cached title for a route
 */
function getCachedTitle(routeName, slug) {
  const cacheKey = `${routeName}:${slug}`
  return routeTitleCache.get(cacheKey)
}

/**
 * Clears the route title cache
 */
function clearRouteCache() {
  routeTitleCache.clear()
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

const staticRoutes = [
  { 
    path: '/', 
    name: 'root', 
    component: HomeView, 
    meta: { title: 'Home - Badmos' } 
  },
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView, 
    meta: { title: 'Login', hideHeader: true, hideFooter: true } 
  },
  { 
    path: '/register', 
    name: 'register', 
    component: RegisterView, 
    meta: { title: 'Become a Badmos', hideHeader: true, hideFooter: true } 
  },
  { 
    path: '/profile', 
    name: 'profile', 
    component: ProfileView, 
    meta: { title: 'My Profile', requiresAuth: true } 
  },
  { 
    path: '/checkout', 
    name: 'checkout', 
    component: CheckoutView, 
    meta: { title: 'Checkout', requiresAuth: true } 
  },
  { 
    path: '/thankyoubadmos', 
    name: 'order-success', 
    component: OrderSuccessView, 
    meta: { title: 'Order Success', requiresAuth: true, hideHeader: true, hideFooter: true } 
  },
  { 
    path: '/myorders', 
    name: 'myorders', 
    component: MyOrderView, 
    meta: { title: 'Your Orders', requiresAuth: true } 
  },
  {
    path: '/verify',
    name: 'email-verification',
    component: VerifyEmail,
    meta: { title: 'Verify Email', hideHeader: true, hideFooter: true }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPassword,
    meta: {  title: 'Reset Password', hideHeader: true, hideFooter: true }
  }
]

const dynamicRoutes = [
  { 
    path: '/:categorySlug', 
    name: 'category', 
    component: CategoryView,
    meta: { title: 'Category - Badmos', routeType: 'category' }
  },
  { 
    path: '/:productSlug', 
    name: 'product-detail', 
    component: ProductDetailView,
    meta: { title: 'Product - Badmos', routeType: 'product' }
  },
  { 
    path: '/:multiPurposeSlug', 
    name: 'multipurpose-detail', 
    component: MultiPurposeView,
    meta: { title: 'Other Content - Badmos', routeType: 'multipurpose' }
  },
  {
    path: '/myorders/:code',
    name: 'OrderDetail',
    component: OrderDetail,
    props: true,
  },
]

const fallbackRoutes = [
  { 
    path: '/:pathMatch(.*)*', 
    name: 'not-found', 
    component: PageNotFoundView, 
    meta: { hideHeader: true, hideFooter: true, title: 'Page Not Found' } 
  },
]

const routes = [...staticRoutes, ...dynamicRoutes, ...fallbackRoutes]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a slug corresponds to a product collection
 */
async function validateCategory(slug) {
  try {
    const response = await client.request(GET_COLLECTION_BY_SLUG, { slug })
    if (response.collection?.id && response.collection.customFields?.isProductCollection !== false) {
      return response.collection
    }
  } catch (err) {
    console.error('Category validation error:', err)
  }
  return null
}

/**
 * Validates if a slug corresponds to a product
 */
async function validateProduct(slug) {
  try {
    const response = await client.request(GET_PRODUCT_BY_SLUG, { slug })
    if (response.product?.id) {
      return response.product
    }
  } catch (err) {
    console.error('Product validation error:', err)
  }
  return null
}

/**
 * Validates if a slug corresponds to multipurpose content (non-product collection)
 */
async function validateMultipurpose(slug) {
  try {
    const response = await client.request(GET_COLLECTION_BY_SLUG, { slug })
    if (response.collection?.id && response.collection.customFields?.isProductCollection !== true) {
      return response.collection
    }
  } catch (err) {
    console.error('Multipurpose content validation error:', err)
  }
  return null
}

// ============================================================================
// ROUTE GUARDS
// ============================================================================

/**
 * Waits for auth store to be ready
 */
async function waitForAuthReady() {
  const authStore = useAuthStore()
  await authStore.initAuth()
  if (!authStore.isAuthReady) {
    console.log('Waiting for auth store to be ready...')
    return new Promise(resolve => {
      const stop = watch(() => authStore.isAuthReady, val => {
        if (val) {
          stop()
          resolve()
        }
      })
    })
  }
}

/**
 * Checks if user is authenticated and redirects to login if needed
 */
async function checkAuth(to, next) {
  const authStore = useAuthStore()
  await waitForAuthReady()
  if (!authStore.canAccessProtected()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return false
  }
  
  return true
}

/**
 * Handles category route validation and potential redirects
 */
async function handleCategoryRoute(to, next) {
  const categorySlug = to.params.categorySlug
  
  // Check if title is already cached (e.g., from query param change)
  const cachedTitle = getCachedTitle('category', categorySlug)
  if (cachedTitle) {
    to.meta.title = cachedTitle
    next()
    return
  }
  
  // First, check if it's a category
  const category = await validateCategory(categorySlug)
  
  if (category) {
    const title = `${category.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('category', categorySlug, title)
    next()
    return
  }

  // If not a category, check if it's a product
  const product = await validateProduct(categorySlug)
  
  if (product) {
    const title = `${product.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('product-detail', categorySlug, title)
    next({
      name: 'product-detail',
      params: { productSlug: categorySlug },
      query: to.query,
    })
    return
  }

  // If not a product, check if it's multipurpose content
  const multipurpose = await validateMultipurpose(categorySlug)
  
  if (multipurpose) {
    const title = `${multipurpose.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('multipurpose-detail', categorySlug, title)
    next({
      name: 'multipurpose-detail',
      params: { multiPurposeSlug: categorySlug },
      query: to.query,
    })
    return
  }

  // Not found fallback
  next({ name: 'not-found' })
}

/**
 * Handles product route validation and potential redirects
 */
async function handleProductRoute(to, next) {
  const productSlug = to.params.productSlug
  
  // Check if title is already cached (e.g., from query param change)
  const cachedTitle = getCachedTitle('product-detail', productSlug)
  if (cachedTitle) {
    to.meta.title = cachedTitle
    next()
    return
  }
  
  // First, check if it's a product
  const product = await validateProduct(productSlug)
  
  if (product) {
    const title = `${product.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('product-detail', productSlug, title)
    next()
    return
  }

  // If not a product, check if it's a category
  const category = await validateCategory(productSlug)
  
  if (category) {
    const title = `${category.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('category', productSlug, title)
    next({
      name: 'category',
      params: { categorySlug: productSlug },
      query: to.query,
    })
    return
  }

  // Not found fallback
  next({ name: 'not-found' })
}

/**
 * Handles multipurpose route validation
 */
async function handleMultipurposeRoute(to, next) {
  const multiPurposeSlug = to.params.multiPurposeSlug
  
  // Check if title is already cached (e.g., from query param change)
  const cachedTitle = getCachedTitle('multipurpose-detail', multiPurposeSlug)
  if (cachedTitle) {
    to.meta.title = cachedTitle
    next()
    return
  }
  
  // Check if it's multipurpose content
  const multipurpose = await validateMultipurpose(multiPurposeSlug)
  
  if (multipurpose) {
    const title = `${multipurpose.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('multipurpose-detail', multiPurposeSlug, title)
    next()
    return
  }

  // If not multipurpose, check if it's a category or product
  const category = await validateCategory(multiPurposeSlug)
  if (category) {
    const title = `${category.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('category', multiPurposeSlug, title)
    next({
      name: 'category',
      params: { categorySlug: multiPurposeSlug },
      query: to.query,
    })
    return
  }

  const product = await validateProduct(multiPurposeSlug)
  if (product) {
    const title = `${product.name} - Badmos`
    to.meta.title = title
    cacheRouteTitle('product-detail', multiPurposeSlug, title)
    next({
      name: 'product-detail',
      params: { productSlug: multiPurposeSlug },
      query: to.query,
    })
    return
  }

  // Not found fallback
  next({ name: 'not-found' })
}

// ============================================================================
// ROUTER GUARDS
// ============================================================================

/**
 * Global beforeEach guard
 * - Handles authentication
 * - Validates dynamic routes
 * - Updates meta.title before navigation
 * - Persists title across query param changes via cache
 */
router.beforeEach(async (to, from, next) => {
  // Check authentication if route requires it
  if (to.meta.requiresAuth) {
    const isAuthenticated = await checkAuth(to, next)
    if (!isAuthenticated) return
  }

  // Handle route-specific validation
  switch (to.name) {
    case 'category':
      await handleCategoryRoute(to, next)
      break
    case 'product-detail':
      await handleProductRoute(to, next)
      break
    case 'multipurpose-detail':
      await handleMultipurposeRoute(to, next)
      break
    default:
      next()
  }
})

/**
 * Global afterEach hook
 * - Updates document title after navigation completes
 * - Persists cached titles to document for query param changes
 */
router.afterEach((to) => {
  let title = 'Badmos'
  
  // Check cache first for dynamic routes
  if (to.name === 'category') {
    const cached = getCachedTitle('category', to.params.categorySlug)
    title = cached || to.meta?.title || title
  } else if (to.name === 'product-detail') {
    const cached = getCachedTitle('product-detail', to.params.productSlug)
    title = cached || to.meta?.title || title
  } else if (to.name === 'multipurpose-detail') {
    const cached = getCachedTitle('multipurpose-detail', to.params.multiPurposeSlug)
    title = cached || to.meta?.title || title
  } else {
    title = to.meta?.title || title
  }
  
  document.title = title
})

export default router