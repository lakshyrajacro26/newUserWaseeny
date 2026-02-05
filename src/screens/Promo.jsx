import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Promo() {
  const navigation = useNavigation();
  const [promo, setPromo] = useState('');

  const applyPromo = (code) => {
    const finalCode = code || promo;

    if (!finalCode) {
      Alert.alert('Error', 'Please enter promo code');
      return;
    }

    Alert.alert('Success', `${finalCode} applied successfully`);
    // yahan future me cart / payment screen ko promo bhej sakte he
    // navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promo Code</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Promo Input */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Enter promo code"
            placeholderTextColor="#9E9E9E"
            style={styles.input}
            value={promo}
            onChangeText={setPromo}
          />
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => applyPromo()}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Available Promo Codes */}
        <Text style={styles.sectionTitle}>Available Promo Codes</Text>

        {/* Card 1 */}
        <View style={styles.card}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1617196033098-54b6b4d5d9eb?w=60&h=60&fit=crop&auto=format',
            }}
            style={styles.icon}
          />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>SUMMER10</Text>
            <Text style={styles.cardDesc}>
              Get 10% OFF on your next order.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => applyPromo('SUMMER10')}>
            <Text style={styles.cardBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Card 2 */}
        <View style={styles.card}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=60&h=60&fit=crop&auto=format',
            }}
            style={styles.icon}
          />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>SAVE50</Text>
            <Text style={styles.cardDesc}>
              ₹50 discount on orders over ₹300.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => applyPromo('SAVE50')}>
            <Text style={styles.cardBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Card 3 */}
        <View style={styles.card}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=60&h=60&fit=crop&auto=format',
            }}
            style={styles.icon}
          />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>FREESHIP</Text>
            <Text style={styles.cardDesc}>
              Free delivery for orders over ₹199.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => applyPromo('FREESHIP')}>
            <Text style={styles.cardBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        <Text style={styles.sectionTitle}>You might also like</Text>

        <View style={styles.bottomRow}>
          <View style={styles.foodCard}>
            <Text style={styles.offerText}>25% OFF</Text>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1600891964337-7a4a19f7b84d?w=300&h=150&fit=crop&auto=format',
              }}
              style={styles.foodImg}
            />
          </View>

          <View style={styles.foodCard}>
            <Text style={styles.offerText}>20% OFF</Text>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=150&fit=crop&auto=format',
              }}
              style={styles.foodImg}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    color: '#000',
  },
  content: {
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  applyBtn: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  applyText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  cardDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  cardBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  foodCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  offerText: {
    position: 'absolute',
    zIndex: 1,
    top: 8,
    left: 8,
    color: '#E53935',
    fontWeight: '700',
  },
  foodImg: {
    width: '100%',
    height: 100,
  },
});
