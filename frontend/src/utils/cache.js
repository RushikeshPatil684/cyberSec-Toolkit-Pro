/**
 * Simple LRU cache for frontend tool results
 * Caches non-sensitive results in memory for session duration
 */

class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const toolCache = new LRUCache(50);

/**
 * Get cached result for a tool query
 * @param {string} toolKey - Tool identifier
 * @param {string} query - Query string (IP, domain, etc.)
 * @returns {Object|null} Cached result or null
 */
export function getCachedResult(toolKey, query) {
  const key = `${toolKey}:${query}`;
  return toolCache.get(key);
}

/**
 * Cache a tool result
 * @param {string} toolKey - Tool identifier
 * @param {string} query - Query string
 * @param {Object} result - Result to cache
 */
export function cacheResult(toolKey, query, result) {
  // Only cache non-sensitive results
  const sensitiveTools = ['password', 'breach'];
  if (sensitiveTools.includes(toolKey)) {
    return; // Don't cache sensitive data
  }
  const key = `${toolKey}:${query}`;
  toolCache.set(key, result);
}

/**
 * Clear cache for a specific tool or all tools
 * @param {string} toolKey - Optional tool identifier
 */
export function clearCache(toolKey = null) {
  if (toolKey) {
    // Remove all entries for this tool
    const keysToDelete = [];
    for (const key of toolCache.cache.keys()) {
      if (key.startsWith(`${toolKey}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => toolCache.cache.delete(key));
  } else {
    toolCache.clear();
  }
}

export default toolCache;

