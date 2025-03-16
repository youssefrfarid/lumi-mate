import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import * as Speech from "expo-speech";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);

  if (!permission) {
    // Still loading permissions
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    console.log("Taking picture...");
    const photo = await cameraRef.current?.takePictureAsync({ base64: false });
    if (photo) {
      // Create a new FormData instance
      const formData = new FormData();
      const file: any = {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      };
      formData.append("image", file);

      try {
        console.log("Uploading image...");
        const response = await fetch("http://192.168.1.110:8000/continue", {
          method: "POST",
          body: formData,
          // It's best not to manually set the Content-Type header here.
        });
        const result = await response.json();
        Speech.speak(result.response, {
          language: "en-US", // Optional: Set the language
          pitch: 1.0, // Optional: Adjust the pitch
          rate: 1.0, // Optional: Adjust the speaking rate
        });
        console.log("Upload successful:", result);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
      // Optionally, show a preview of the taken photo.
      setImageUri(photo.uri);
    }
  };

  const recordVideo = async () => {
    if (recording) {
      setRecording(false);
      cameraRef.current?.stopRecording();
      return;
    }
    setRecording(true);
    const video = await cameraRef.current?.recordAsync();
    console.log({ video });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Image
        source={{ uri: imageUri ?? undefined }}
        contentFit="contain"
        style={styles.previewImage}
      />
      <Button onPress={() => setImageUri(null)} title="Take another picture" />
    </View>
  );

  const renderCamera = () => (
    <CameraView
      style={styles.camera}
      ref={cameraRef}
      mode={mode}
      facing={facing}
      mute={false}
      responsiveOrientationWhenOrientationLocked
    >
      <View style={styles.controls}>
        <Pressable onPress={toggleMode}>
          {mode === "picture" ? (
            <AntDesign name="picture" size={32} color="white" />
          ) : (
            <Feather name="video" size={32} color="white" />
          )}
        </Pressable>
        <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
          {({ pressed }) => (
            <View
              style={[styles.shutterButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <View
                style={[
                  styles.shutterButtonInner,
                  { backgroundColor: mode === "picture" ? "white" : "red" },
                ]}
              />
            </View>
          )}
        </Pressable>
        <Pressable onPress={toggleFacing}>
          <FontAwesome6 name="rotate-left" size={32} color="white" />
        </Pressable>
      </View>
    </CameraView>
  );

  return (
    <View style={styles.container}>
      {imageUri ? renderPreview() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 10,
    color: "#fff",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  controls: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterButton: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: 300,
    aspectRatio: 1,
  },
});
