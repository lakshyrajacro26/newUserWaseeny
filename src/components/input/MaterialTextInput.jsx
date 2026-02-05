import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

/**
 * Material UI TextInput Component with External Label
 * Supports single line and multiline inputs
 */
const MaterialTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'outlined',
  secureTextEntry = false,
  error = false,
  errorText = '',
  keyboardType = 'default',
  showPasswordToggle = false,
  style,
  autoCapitalize = 'sentences',
  multiline = false,           // NEW: Multiline support
  numberOfLines = 1,   
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {/* External Label (above input) */}
      {label && (
        <Text style={styles.externalLabel}>{label}</Text>
      )}

      <PaperTextInput
        // No internal label to avoid duplication
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        mode={mode}
        secureTextEntry={showPasswordToggle ? !showPassword : secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={error}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
        theme={{
          colors: {
            primary: '#000000',
            error: '#E11D2E',
            placeholder: '#9E9E9E',
            text: '#000000',
            background: isFocused ? '#FFFFFF' : '#F2F2F2',
          },
          roundness: 12,
        }}
        outlineColor="#E0E0E0"
        activeOutlineColor="#FF3B30"
        textColor="#000000"
        cursorColor="#000000"
        selectionColor="#000000"
        contentStyle={[
          styles.inputContent,
          multiline && styles.inputContentMultiline,
        ]}
        right={
          showPasswordToggle && !multiline ? (
            <PaperTextInput.Icon
              icon={() => (
                <Image
                  source={require('../../assets/icons/view.png')}
                  style={styles.eyeIcon}
                  resizeMode="contain"
                />
              )}
              onPress={() => setShowPassword(!showPassword)}
              forceTextInputFocus={false}
            />
          ) : null
        }
        {...rest}
      />

      {/* Error Text */}
      {error && errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  // External label above input
  externalLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    backgroundColor: '#FFF5F5',
  },
  // Multiline specific styles
  inputMultiline: {
    minHeight: 100,
    maxHeight: 200,
  },
  inputContent: {
    paddingHorizontal: 14,
  },
  inputContentMultiline: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  eyeIcon: {
    width: 18,
    height: 18,
    tintColor: '#9AA0A6',
  },
  errorText: {
    color: '#E11D2E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default MaterialTextInput;