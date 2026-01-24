/**
 * ============================================================
 * 🚀 CACHE SERVICE (Redis with In-Memory Fallback)
 * ============================================================
 * Provides caching layer for:
 * - Lookup tables (Race, Nationality, Gender, etc.)
 * - RBAC permissions
 * - Dashboard aggregates
 * 
 * Features:
 * - Automatic TTL management
 * - Center-aware cache keys (multi-tenant safe)
 * - Graceful fallback to in-memory cache if Redis unavailable
 */

let redisClient = null;
const inMemoryCache = new Map();

// Try to initialize Redis (optional dependency)
try {
  const redis = require('redis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = redis.createClient({ url: redisUrl });
  
  redisClient.on('error', () => {
    // Silently fall back to in-memory cache
    redisClient = null;
  });
  
  redisClient.on('connect', () => {
    console.log('✅ Redis cache connected');
  });
  
  // Connect asynchronously (non-blocking)
  redisClient.connect().catch(() => {
    // Silently fall back to in-memory cache
    redisClient = null;
  });
} catch (err) {
  // Silently fall back to in-memory cache
  redisClient = null;
}

/**
 * Generate center-aware cache key
 * @param {string} prefix - Cache key prefix
 * @param {number|null} centerId - Center ID (null for global)
 * @param {string} suffix - Optional suffix
 * @returns {string}
 */
const getCacheKey = (prefix, centerId = null, suffix = '') => {
  const centerPart = centerId !== null ? `:center:${centerId}` : ':global';
  return `${prefix}${centerPart}${suffix ? ':' + suffix : ''}`;
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      // Fallback to in-memory cache
      const cached = inMemoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
      inMemoryCache.delete(key);
      return null;
    }
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<boolean>}
 */
const set = async (key, value, ttlSeconds = 3600) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } else {
      // Fallback to in-memory cache
      inMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return true;
    }
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key (supports wildcards with *)
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      if (key.includes('*')) {
        // Pattern delete (Redis SCAN + DEL)
        const keys = await redisClient.keys(key);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        await redisClient.del(key);
      }
      return true;
    } else {
      // Fallback to in-memory cache
      if (key.includes('*')) {
        const pattern = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
        for (const k of inMemoryCache.keys()) {
          if (pattern.test(k)) {
            inMemoryCache.delete(k);
          }
        }
      } else {
        inMemoryCache.delete(key);
      }
      return true;
    }
  } catch (err) {
    console.error('Cache delete error:', err);
    return false;
  }
};

/**
 * Cache lookup table data
 * @param {string} tableName - Lookup table name
 * @param {number|null} centerId - Center ID (null for global)
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttlSeconds - Cache TTL (default: 24 hours)
 * @returns {Promise<Array>}
 */
const cacheLookup = async (tableName, centerId, fetchFn, ttlSeconds = 86400) => {
  const key = getCacheKey('lookup', centerId, tableName);
  
  // Try cache first
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch and cache
  const data = await fetchFn();
  await set(key, data, ttlSeconds);
  return data;
};

/**
 * Invalidate lookup cache
 * @param {string} tableName - Lookup table name
 * @param {number|null} centerId - Center ID (null for all centers)
 * @returns {Promise<boolean>}
 */
const invalidateLookup = async (tableName, centerId = null) => {
  try {
    if (centerId !== null) {
      const key = getCacheKey('lookup', centerId, tableName);
      console.log(`[cacheService.invalidateLookup] Invalidating key: ${key}`);
      return await del(key);
    } else {
      // Invalidate for all centers - use pattern matching
      const pattern = getCacheKey('lookup', '*', tableName);
      console.log(`[cacheService.invalidateLookup] Invalidating pattern: ${pattern}`);
      const result = await del(pattern);
      // Also try the exact global key just in case
      const globalKey = getCacheKey('lookup', null, tableName);
      console.log(`[cacheService.invalidateLookup] Also invalidating global key: ${globalKey}`);
      await del(globalKey);
      return result;
    }
  } catch (err) {
    console.error(`[cacheService.invalidateLookup] Error invalidating cache for ${tableName}:`, err.message);
    return false;
  }
};

/**
 * Cache dashboard data
 * @param {string} dashboardName - Dashboard identifier
 * @param {number|null} centerId - Center ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttlSeconds - Cache TTL (default: 5 minutes)
 * @returns {Promise<any>}
 */
const cacheDashboard = async (dashboardName, centerId, fetchFn, ttlSeconds = 300) => {
  const key = getCacheKey('dashboard', centerId, dashboardName);
  
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetchFn();
  await set(key, data, ttlSeconds);
  return data;
};

/**
 * Invalidate dashboard cache
 * @param {string} dashboardName - Dashboard identifier
 * @param {number|null} centerId - Center ID (null for all centers)
 * @returns {Promise<boolean>}
 */
const invalidateDashboard = async (dashboardName, centerId = null) => {
  if (centerId !== null) {
    const key = getCacheKey('dashboard', centerId, dashboardName);
    return await del(key);
  } else {
    const pattern = getCacheKey('dashboard', '*', dashboardName);
    return await del(pattern);
  }
};

module.exports = {
  get,
  set,
  del,
  getCacheKey,
  cacheLookup,
  invalidateLookup,
  cacheDashboard,
  invalidateDashboard,
  // Expose for testing
  _inMemoryCache: inMemoryCache,
  _redisClient: redisClient,
};

