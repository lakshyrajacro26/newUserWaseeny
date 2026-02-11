import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const RatingDrawerModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => setRating(star)}>
        <Icon
          name={star <= rating ? "star" : "star-outline"}
          size={32}
          color={star <= rating ? "#FFC107" : "#D3D3D3"}
          style={{ marginHorizontal: 4 }}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer}>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close" size={20} color="#000" />
          </TouchableOpacity>

          {/* Restaurant Image */}
          <Image
            source={{ uri: "https://via.placeholder.com/100" }}
            style={styles.image}
          />

          {/* Title */}
          <Text style={styles.title}>Cellar Door Restaurant</Text>
          <Text style={styles.subtitle}>Pizza, Italian, Fast Food</Text>

          {/* Stars */}
          <View style={styles.starRow}>{renderStars()}</View>

          {/* Message Box */}
          <TextInput
            placeholder="Add Message"
            style={styles.input}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => onSubmit({ rating, message })}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RatingDrawerModal;


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#F1F1F1",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 15,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
