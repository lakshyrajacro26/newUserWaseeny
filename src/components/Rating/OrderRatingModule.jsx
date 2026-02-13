import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import RatingStars from './RatingStars';
import ImageUploader from './ImageUploader';
import FeedbackInput from './FeedbackInput';
import IssueSelector from './IssueSelector';
import {
  rateOrder,
  rateRestaurant,
  rateRider,
  reportOrderIssue,
  uploadOrderPhotos,
} from '../../services/orderService';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const OrderRatingModule = ({ order, onSuccess }) => {
  const [ratingExpanded, setRatingExpanded] = useState(false);
  const [issueExpanded, setIssueExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Rating states
  const [orderRating, setOrderRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);

  // Feedback & Photos
  const [feedback, setFeedback] = useState('');
  const [images, setImages] = useState([]);

  // Issue reporting
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');

  // Already submitted flags
  const [hasRated, setHasRated] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const orderId = order?.id || order?._id;
  const restaurantId = order?.restaurant?._id;
  const riderId = order?.rider?._id || order?.deliveryAgent?._id;

  const canSubmitRating = useMemo(() => {
    return orderRating > 0 || restaurantRating > 0 || riderRating > 0;
  }, [orderRating, restaurantRating, riderRating]);

  const handleSubmitRating = async () => {
    if (!canSubmitRating) {
      Alert.alert('Rating Required', 'Please provide at least one rating before submitting.');
      return;
    }

    if (orderRating > 0 && !feedback.trim()) {
      Alert.alert('Feedback Required', 'Please share your feedback along with the rating.');
      return;
    }

    setSubmitting(true);

    try {
      // DUMMY MODE: Simulate API call with timeout
      console.log('📝 Submitting Rating (Dummy Mode):', {
        orderId,
        orderRating,
        restaurantRating,
        riderRating,
        feedback: feedback.trim(),
        imagesCount: images.length,
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful submission
      setHasRated(true);
      
      Toast.show({
        type: 'success',
        text1: 'Thank You! 🎉',
        text2: 'Your feedback has been submitted successfully.',
        position: 'top',
        visibilityTime: 3000,
      });

      if (onSuccess) {
        onSuccess();
      }

      // PRODUCTION CODE (commented for dummy mode):
      /*
      const promises = [];

      // Rate Order
      if (orderRating > 0) {
        promises.push(
          rateOrder(orderId, {
            rating: orderRating,
            feedback: feedback.trim(),
          })
        );
      }

      // Rate Restaurant
      if (restaurantRating > 0 && restaurantId) {
        promises.push(
          rateRestaurant(restaurantId, {
            rating: restaurantRating,
            orderId: orderId,
          })
        );
      }

      // Rate Rider
      if (riderRating > 0 && riderId) {
        promises.push(
          rateRider(riderId, {
            rating: riderRating,
            orderId: orderId,
          })
        );
      }

      // Upload Photos
      if (images.length > 0) {
        promises.push(uploadOrderPhotos(orderId, images));
      }

      await Promise.all(promises);

      setHasRated(true);
      Toast.show({
        type: 'success',
        text1: 'Thank You!',
        text2: 'Your feedback has been submitted successfully.',
        position: 'top',
      });

      if (onSuccess) {
        onSuccess();
      }
      */
    } catch (error) {
      console.error('Rating submission error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit rating. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedIssue) {
      Alert.alert('Issue Type Required', 'Please select the type of issue you faced.');
      return;
    }

    setSubmitting(true);

    try {
      // DUMMY MODE: Simulate API call with timeout
      console.log('🚨 Reporting Issue (Dummy Mode):', {
        orderId,
        issueType: selectedIssue,
        description: issueDescription.trim(),
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Simulate successful submission
      setHasReported(true);
      setSelectedIssue(null);
      setIssueDescription('');

      Toast.show({
        type: 'success',
        text1: 'Issue Reported ✅',
        text2: 'We will look into this and get back to you soon.',
        position: 'top',
        visibilityTime: 3000,
      });

      if (onSuccess) {
        onSuccess();
      }

      // PRODUCTION CODE (commented for dummy mode):
      /*
      await reportOrderIssue(orderId, {
        issueType: selectedIssue,
        description: issueDescription.trim(),
      });

      setHasReported(true);
      setSelectedIssue(null);
      setIssueDescription('');

      Toast.show({
        type: 'success',
        text1: 'Issue Reported',
        text2: 'We will look into this and get back to you soon.',
        position: 'top',
      });

      if (onSuccess) {
        onSuccess();
      }
      */
    } catch (error) {
      console.error('Issue reporting error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to report issue. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (order?.status !== 'delivered') {
    return null;
  }

  return (
    <View style={styles.mainContainer}>
      {/* RATING SECTION */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setRatingExpanded(!ratingExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>
            {hasRated ? '✓ Rating Submitted' : '⭐ Rate Your Experience'}
          </Text>
          {ratingExpanded ? (
            <ChevronUp size={20} color="#E53935" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        {ratingExpanded && !hasRated && (
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {/* Rating Stars */}
              <View style={styles.ratingsGrid}>
                <RatingStars
                  rating={orderRating}
                  onRatingChange={setOrderRating}
                  label="Overall Experience"
                  size={28}
                  containerStyle={styles.compactRating}
                />

                {restaurantId && (
                  <RatingStars
                    rating={restaurantRating}
                    onRatingChange={setRestaurantRating}
                    label="Restaurant"
                    size={28}
                    containerStyle={styles.compactRating}
                  />
                )}

                {riderId && (
                  <RatingStars
                    rating={riderRating}
                    onRatingChange={setRiderRating}
                    label="Delivery Rider"
                    size={28}
                    containerStyle={styles.compactRating}
                  />
                )}
              </View>

              {/* Feedback */}
              <FeedbackInput
                value={feedback}
                onChangeText={setFeedback}
                required={orderRating > 0}
                maxLength={300}
              />

              {/* Photos */}
              <ImageUploader
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!canSubmitRating || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={!canSubmitRating || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {hasRated && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>✓ Thank you for your feedback!</Text>
          </View>
        )}
      </View>

      {/* REPORT ISSUE SECTION */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIssueExpanded(!issueExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>
            {hasReported ? '✓ Issue Reported' : '🚨 Report an Issue'}
          </Text>
          {issueExpanded ? (
            <ChevronUp size={20} color="#FF6B00" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        {issueExpanded && !hasReported && (
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <IssueSelector
                selectedIssue={selectedIssue}
                onIssueSelect={setSelectedIssue}
                description={issueDescription}
                onDescriptionChange={setIssueDescription}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  styles.reportButton,
                  (!selectedIssue || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleReportIssue}
                disabled={!selectedIssue || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Report Issue</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {hasReported && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>✓ We'll look into this soon!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: scale(16),
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    letterSpacing: -0.3,
  },
  content: {
    padding: SPACING.lg,
    maxHeight: scale(520),
    backgroundColor: '#FEFEFE',
  },
  ratingsGrid: {
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  compactRating: {
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  submitButton: {
    backgroundColor: '#E53935',
    paddingVertical: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    minHeight: scale(50),
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D0D0D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  reportButton: {
    backgroundColor: '#ed1c24',
    shadowColor: '#ed1c24',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  successMessage: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: scale(16),
    backgroundColor: '#F0FDF4',
    borderTopWidth: 2,
    borderTopColor: '#86EFAC',
  },
  successText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#16A34A',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default OrderRatingModule;
