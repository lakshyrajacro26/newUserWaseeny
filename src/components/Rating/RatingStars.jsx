import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const RatingStars = ({ 
  rating = 0, 
  onRatingChange, 
  size = 32, 
  editable = true,
  label = '',
  showLabel = true,
  containerStyle = {}
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const activeRating = hoverRating || rating;

  const handlePress = (value) => {
    if (editable && onRatingChange) {
      onRatingChange(value);
    }
  };

  const ratingText = activeRating === 0 
    ? 'Tap to rate' 
    : activeRating === 1 
    ? 'Poor' 
    : activeRating === 2 
    ? 'Fair' 
    : activeRating === 3 
    ? 'Good' 
    : activeRating === 4 
    ? 'Very Good' 
    : 'Excellent';

  return (
    <View style={[styles.container, containerStyle]}>
      {showLabel && label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            onPressIn={() => editable && setHoverRating(star)}
            onPressOut={() => setHoverRating(0)}
            disabled={!editable}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={star <= activeRating ? '#FBBF24' : '#E5E7EB'}
              fill={star <= activeRating ? '#FBBF24' : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        ))}
      </View>
      
      {showLabel && (
        <Text style={[
          styles.ratingText,
          activeRating > 0 && styles.ratingTextActive
        ]}>
          {ratingText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  starButton: {
    padding: scale(4),
  },
  ratingText: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    marginTop: scale(6),
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  ratingTextActive: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});

export default RatingStars;
