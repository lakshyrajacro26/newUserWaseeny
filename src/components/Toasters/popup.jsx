import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';

export const toastConfig = {
  topSuccess: ({ text1 = '', text2 = '', props = {} } = {}) => (
    <View style={styles.container}>
      {props?.showLoader !== false && (
        <ActivityIndicator size="small" color="#ed1c24" style={styles.loader} />
      )}
      <View style={styles.textWrap}>
        {!!text1 && <Text style={styles.title}>{text1}</Text>}
        {!!text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => Toast.hide()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  ),
  topError: ({ text1 = '', text2 = '' } = {}) => (
    <View style={[styles.container, styles.errorContainer]}>
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text style={[styles.title, styles.errorTitle]}>{text1}</Text>
        )}
        {!!text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => Toast.hide()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  ),
};

export default toastConfig;

const styles = StyleSheet.create({
  container: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
  },
  loader: {
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  message: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    color: '#B91C1C',
  },
});
