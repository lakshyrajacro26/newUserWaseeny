/**
 * Get the average rating value from restaurant item
 * Handles multiple data structures from API
 */
export const getRatingAverage = item => {
  if (typeof item?.rating?.average === 'number') return item.rating.average;
  if (typeof item?.ratingAverage === 'number') return item.ratingAverage;
  if (typeof item?.rating === 'number') return item.rating;
  if (typeof item?.rating?.average === 'string') {
    const avg = Number(item.rating.average);
    return Number.isFinite(avg) ? avg : 0;
  }
  if (typeof item?.rating === 'string') {
    const avg = Number(item.rating);
    return Number.isFinite(avg) ? avg : 0;
  }
  return 0;
};

/**
 * Get the rating count from restaurant item
 * Handles multiple data structures from API
 */
export const getRatingCount = item => {
  if (typeof item?.ratingCount === 'number') return item.ratingCount;
  if (typeof item?.rating?.count === 'number') return item.rating.count;
  if (typeof item?.rating?.count === 'string') {
    const count = Number(item.rating.count);
    return Number.isFinite(count) ? count : 0;
  }
  return item?.ratingCount || 0;
};
