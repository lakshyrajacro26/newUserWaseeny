import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView } from 'react-native';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';

export default function ContactSupport() {
  const navigation = useNavigation()
  useHideTabBar(navigation);
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
         <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Contact Support </Text>
            <View style={{ width: 24 }} />
          </View>

        <ScrollView style={styles.container} >
          <View style={styles.chat}>
            <View style={styles.leftBubble}>
              <Text>Hello</Text>
            </View>

            <View style={styles.leftBubble}>
              <Text>What i help you today!</Text>
            </View>

            <View style={styles.rightBubble}>
              <Text style={{ color: '#fff' }}>Hello</Text>
            </View>

            <View style={styles.rightBubble}>
              <Text style={{ color: '#fff' }}>
                I don't know how i apply the coupons in the cart
              </Text>
            </View>

            <View style={styles.leftBubble}>
              <Text>Typing...</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput placeholder="Type Message..." style={styles.input} />
          <TouchableOpacity style={styles.send}>
            <Send color={"#E41C26"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

   header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  chat: { flex: 1, padding: 16 },
  leftBubble: {
    backgroundColor: '#F2F2F2',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  rightBubble: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginVertical: 6,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height:60
  },
  send: {
    marginLeft: 10,
    justifyContent: 'center',
  },
});
