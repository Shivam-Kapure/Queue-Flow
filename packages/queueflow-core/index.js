/**
 * QueueFlow Core Engine
 * Standardized, dependency-free algorithms for virtual waiting rooms.
 */

/**
 * Creates a queue configuration structure.
 * @param {Object} options
 * @param {string} options.type - 'FIFO', 'PRIORITY', or 'VIP'
 * @param {string} [options.name] - Optional name of the queue
 * @param {number} [options.avgProcessingTime] - Average time to serve one user, in seconds
 * @returns {Object} A fresh queue object
 */
export function createQueue({ type = 'FIFO', name = 'Default Queue', avgProcessingTime = 60 } = {}) {
  return {
    name,
    type, // 'FIFO', 'PRIORITY', 'VIP'
    avgProcessingTime, // in seconds
    members: [], // List of { id, joinedAt, priority, isVip }
    processedCount: 0,
    totalWaitTime: 0
  };
}

/**
 * Joins a user to the queue.
 * @param {Object} queue - The queue object
 * @param {Object} user - User information { id, name, ... }
 * @param {Object} [options]
 * @param {number} [options.priority] - Priority number (higher means higher priority, used in PRIORITY mode)
 * @param {boolean} [options.isVip] - True if user bypasses normal queueing constraints
 * @returns {Object} The updated queue
 */
export function joinQueue(queue, user, { priority = 0, isVip = false } = {}) {
  // Prevent duplicate join
  if (queue.members.some(m => m.id === user.id)) {
    return queue;
  }

  const member = {
    id: user.id,
    name: user.name || `User-${user.id.substring(0, 4)}`,
    joinedAt: Date.now(),
    priority: Number(priority) || 0,
    isVip: !!isVip
  };

  if (queue.type === 'VIP' && member.isVip) {
    // VIP goes to the front of the queue, but behind other VIPs
    const lastVipIndex = queue.members.findLastIndex(m => m.isVip);
    if (lastVipIndex !== -1) {
      queue.members.splice(lastVipIndex + 1, 0, member);
    } else {
      queue.members.unshift(member);
    }
  } else if (queue.type === 'PRIORITY') {
    // Priority sorting: Higher priority goes closer to the front.
    // Stable sorting: if priority matches, sort by joinedAt.
    const insertIndex = queue.members.findIndex(m => {
      if (member.priority > m.priority) return true;
      if (member.priority === m.priority) {
        return member.joinedAt < m.joinedAt;
      }
      return false;
    });

    if (insertIndex !== -1) {
      queue.members.splice(insertIndex, 0, member);
    } else {
      queue.members.push(member);
    }
  } else {
    // Standard FIFO: simple push to the end
    queue.members.push(member);
  }

  return queue;
}

/**
 * Removes a user from the queue by ID.
 * @param {Object} queue 
 * @param {string} userId 
 * @returns {Object} The updated queue
 */
export function leaveQueue(queue, userId) {
  queue.members = queue.members.filter(m => m.id !== userId);
  return queue;
}

/**
 * Processes and serves the next user in line (removes from front).
 * @param {Object} queue 
 * @returns {Object|null} The served user object, or null if empty
 */
export function nextUser(queue) {
  if (queue.members.length === 0) {
    return null;
  }
  const servedUser = queue.members.shift();
  
  // Track metrics
  queue.processedCount += 1;
  const timeSpent = (Date.now() - servedUser.joinedAt) / 1000; // in seconds
  queue.totalWaitTime += timeSpent;

  return servedUser;
}

/**
 * Gets the current 1-indexed position of a user in the queue.
 * @param {Object} queue 
 * @param {string} userId 
 * @returns {number} The 1-based index position, or -1 if not found
 */
export function getPosition(queue, userId) {
  const index = queue.members.findIndex(m => m.id === userId);
  return index === -1 ? -1 : index + 1;
}

/**
 * Estimates the wait time for a given position.
 * @param {Object} queue 
 * @param {number} position - 1-indexed position in line
 * @param {number} [customAvgTime] - Override avgProcessingTime (in seconds)
 * @returns {number} Estimated wait time in seconds
 */
export function estimateWaitTime(queue, position, customAvgTime = null) {
  if (position <= 0) return 0;
  const timePerUser = customAvgTime !== null ? customAvgTime : queue.avgProcessingTime;
  
  // Wait time is based on how many people are in front of this position
  return (position - 1) * timePerUser;
}
