import { useState } from "react";
import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
  RTCView,
} from "react-native-webrtc";
export default function Home() {
  const [status, setStatus] = useState("Idle");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  };

  const handleStart = async () => {
    try {
      await requestPermissions();

      const localStream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(localStream);

      const pc = new RTCPeerConnection();

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch("http://192.168.0.45:8000/offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
        }),
      });

      const answer = await response.json();

      await pc.setRemoteDescription(answer);

      setStatus("Connected to server 🚀");
    } catch (error) {
      console.log("Connection error:", error);
      setStatus("Connection failed ❌");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebRTC Camera Stream</Text>
      <Text style={{ marginBottom: 10 }}>{status}</Text>

      {!stream && <Button title="Start Streaming" onPress={handleStart} />}

      {stream && (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.video}
          objectFit="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
  video: {
    width: "100%",
    height: 400,
    marginTop: 20,
  },
});
