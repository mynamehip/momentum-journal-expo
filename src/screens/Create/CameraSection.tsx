import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface CameraSectionProps {
  camRef: React.RefObject<CameraView | null>;
  on: boolean; // Trạng thái bật/tắt camera
  h: Animated.AnimatedInterpolation<string | number>; // Chiều cao animation
  onSnap: () => void; // Hàm chụp ảnh
  onReq: () => void; // Hàm yêu cầu quyền camera
  colors: any;
}

const CameraSection: React.FC<CameraSectionProps> = ({
  camRef, on, h, onSnap, onReq, colors,
}) => {
  const [permission] = useCameraPermissions();

  return (
    <Animated.View style={[styles.container, { height: h }]}>
      {/* Hiển thị Camera nếu đã cấp quyền và đang ở trạng thái ON */}
      {on && permission?.granted ? (
        <>
          <CameraView 
            ref={camRef} 
            style={styles.cam} 
            facing="back" 
            responsiveOrientationWhenLocked 
            active={on}
          />
          <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
            {/* Nút chụp ảnh */}
            <TouchableOpacity style={styles.btn} onPress={onSnap} activeOpacity={0.8}>
              <View style={styles.inner} />
            </TouchableOpacity>
          </View>
        </>
      ) : on && !permission?.granted ? (
        /* Giao diện yêu cầu quyền camera nếu chưa được cấp */
        <View style={[styles.empty, { backgroundColor: colors.card }]}>
          <Ionicons name="camera" size={32} color={colors.textSecondary} />
          <Text style={[styles.eText, { color: colors.text }]}>Camera permission needed</Text>
          <TouchableOpacity style={[styles.req, { backgroundColor: colors.primary }]} onPress={onReq}>
            <Text style={styles.reqText}>Grant access</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center' },
  cam: { flex: 1 }, // Camera sẽ lấp đầy không gian khả dụng của container
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16 },
  btn: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  inner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  eText: { fontSize: 14, fontWeight: '500' },
  req: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  reqText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default CameraSection;
