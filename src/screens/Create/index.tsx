import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated, PanResponder, LayoutChangeEvent, Modal, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, setAudioModeAsync, requestRecordingPermissionsAsync, RecordingPresets } from 'expo-audio';
import { MomentType, PrivacyLevel, JournalEntry, Group } from '../../types';
import { saveEntryToDestinations, getUserGroups, getDefaultDestinations } from '../../services/dataService';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { calculateSentimentScore } from '../../utils';
import CameraSection from './CameraSection';
import InputPanel from './InputPanel';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Các mốc tỷ lệ hiển thị cho bảng điều khiển (0: ẩn camera, 1: ẩn hoàn toàn input)
const Ratios = { MIN: 0.08, MID: 0.5, MAX: 1 };

const CreateScreen: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // --- State cho Form dữ liệu ---
  const [type, setType] = useState<MomentType>(MomentType.TEXT); // Loại moment (ảnh, video, chữ...)
  const [text, setText] = useState(''); // Nội dung caption
  const [tags, setTags] = useState<string[]>([]); // Danh sách thẻ tag
  const [newTag, setNewTag] = useState(''); // Text nhập tag mới
  const [isTagging, setIsTagging] = useState(false); // Trạng thái mở input nhập tag
  const [preview, setPreview] = useState<string | null>(null); // Link ảnh/video xem trước
  const [audio, setAudio] = useState<string | null>(null); // Link file âm thanh
  const [moodScore, setMoodScore] = useState<number | null>(null); // Điểm tâm trạng tự chọn
  const [destinations, setDestinations] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  
  // --- State cho trạng thái ứng dụng ---
  const [saving, setSaving] = useState(false); // Đang lưu dữ liệu
  const [camOn, setCamOn] = useState(true); // Trạng thái bật/tắt camera (để tối ưu hiệu năng)
  const [isRec, setIsRec] = useState(false); // Đang ghi âm
  const [cHeight, setCHeight] = useState(0); // Chiều cao tổng thể của màn hình
  
  // --- Refs & Animation logic ---
  const hRef = useRef(0);
  const camRef = useRef<CameraView>(null);
  const camOnRef = useRef(setCamOn); // Dùng ref để truy cập state trong PanResponder mà không bị stale closure
  camOnRef.current = setCamOn;
  
  const ratio = useRef(new Animated.Value(Ratios.MID)).current; // Giá trị animation cho việc kéo panel
  const ratioVal = useRef(Ratios.MID); // Lưu giá trị hiện tại của ratio để tính toán logic
  const sRatio = useRef(Ratios.MID); // Lưu giá trị ratio tại thời điểm bắt đầu kéo (start)
  
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [, reqCam] = useCameraPermissions();

  // Đồng bộ giá trị animation vào ref để tính toán logic kéo thả
  useEffect(() => {
    const sub = ratio.addListener(({ value }) => { ratioVal.current = value; });
    return () => ratio.removeListener(sub);
  }, [ratio]);

  // Reset trạng thái khi Modal được mở lên
  useEffect(() => {
    if (visible) {
      reqCam();
      ratio.stopAnimation();
      ratio.setValue(Ratios.MID);
      ratioVal.current = Ratios.MID;
      sRatio.current = Ratios.MID;
      setCamOn(true);
      
      if (user) {
        getUserGroups(user.uid).then(setUserGroups);
        getDefaultDestinations(user.uid).then(setDestinations);
      } else {
        setDestinations(['personal']);
      }
    }
  }, [visible, ratio, reqCam, user]);

  // Dọn dẹp recorder khi unmount
  useEffect(() => {
    return () => {
      try {
        if (recorder.isRecording) recorder.stop();
      } catch (e) {
        // Tránh log lỗi khi object đã bị giải phóng
      }
    };
  }, [recorder]);

  const canSave = Boolean(text.trim() || preview || audio);

  // Reset form về trạng thái ban đầu
  const reset = () => {
    setText(''); setTags([]); setPreview(null); setAudio(null);
    setType(MomentType.TEXT);
    setMoodScore(null);
    setDestinations(['personal']); // Reset tạm, sẽ load lại default lúc mở
  };

  // Lưu Moment mới
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const mediaUrl = preview || audio || undefined;
    const entry: Omit<JournalEntry, 'id'> = {
      userId: user?.uid || 'local',
      content: text.trim(),
      type,
      createdAt: Date.now(),
      moodScore: moodScore !== null ? moodScore : calculateSentimentScore(text),
      tags,
      privacy: PrivacyLevel.PRIVATE,
      ...(mediaUrl ? { mediaUrl } : {}),
      location: 'Home',
    };
    try {
      await saveEntryToDestinations(destinations.length ? destinations : ['personal'], entry, user?.uid || null);
      setSaving(false);
      reset();
      // Phát tín hiệu làm mới dữ liệu cho màn hình Home
      DeviceEventEmitter.emit('refresh_home');
      onSaved();
    } catch (e) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save moment.');
    }
  };

  // Thêm tag mới vào danh sách
  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setIsTagging(false);
    }
  };

  // Chọn ảnh hoặc video từ thư viện (Aspect ratio 4:3)
  const pickMedia = async (mediaType: ImagePicker.MediaTypeOptions, type: MomentType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: mediaType, 
      allowsEditing: true, 
      aspect: [4, 3], // Ép tỉ lệ 4:3
      quality: 0.8 
    });
    if (!res.canceled) {
      setPreview(res.assets[0].uri);
      setAudio(null);
      setType(type);
    }
  };

  // Chụp ảnh bằng camera
  const takePhoto = async () => {
    if (!camRef.current) return;
    try {
      const p = await camRef.current.takePictureAsync({ quality: 0.8 });
      if (p?.uri) { setPreview(p.uri); setAudio(null); setType(MomentType.PHOTO); }
    } catch (e) { console.error(e); }
  };

  // Bật/Tắt chế độ ghi âm
  const toggleRec = async () => {
    try {
      if (isRec) {
        await recorder.stop();
        if (recorder.uri) { setAudio(recorder.uri); setPreview(null); setType(MomentType.AUDIO); }
        setIsRec(false);
      } else {
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission needed');
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.record();
        setIsRec(true);
      }
    } catch (error) {
      console.warn('Audio Recorder Error:', error);
      setIsRec(false);
    }
  };

  const close = async () => { 
    try {
      if (recorder.isRecording) await recorder.stop(); 
    } catch (e) {}
    onClose(); 
  };

  // Lấy chiều cao màn hình để tính toán animation kéo thả
  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setCHeight(h);
    hRef.current = h;
  };

  // Logic xử lý kéo thả (PanResponder) để thay đổi kích thước vùng Camera/Input
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2, // Chỉ bắt đầu khi vuốt dọc quá 2px
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => { ratio.stopAnimation(); sRatio.current = ratioVal.current; },
      onPanResponderMove: (_, g) => {
        const h = hRef.current || 800;
        const next = Math.min(Ratios.MAX, Math.max(Ratios.MIN, sRatio.current - g.dy / h));
        ratio.setValue(next);
        ratioVal.current = next;
      },
      onPanResponderRelease: () => {
        // Tự động "hút" về mốc gần nhất (MIN, MID, MAX) khi buông tay
        const cur = ratioVal.current;
        const snaps = [Ratios.MIN, Ratios.MID, Ratios.MAX];
        let near = snaps[0];
        snaps.forEach(p => { if (Math.abs(p - cur) < Math.abs(near - cur)) near = p; });
        Animated.spring(ratio, { toValue: near, useNativeDriver: false, tension: 120, friction: 18 }).start();
        camOnRef.current(near < Ratios.MAX); // Tắt camera nếu panel chiếm toàn màn hình
      },
    })
  ).current;

  // Tính toán chiều cao linh hoạt cho Camera và Input Panel dựa trên animation ratio
  const camH = ratio.interpolate({ inputRange: [0, 1], outputRange: [cHeight, 0] });
  const inH = ratio.interpolate({ inputRange: [0, 1], outputRange: [0, cHeight] });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView style={[styles.main, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Thanh Header */}
        <View style={[styles.head, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={close} style={styles.btn}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Moment</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !canSave} style={[styles.save, { backgroundColor: saving || !canSave ? colors.inputBackground : colors.primary }]}>
            {saving ? <ActivityIndicator size="small" color={colors.textSecondary} /> : (
              <>
                <Text style={[styles.saveText, { color: !canSave ? colors.textSecondary : '#fff' }]}>Save</Text>
                <Ionicons name="send" size={14} color={!canSave ? colors.textSecondary : '#fff'} style={{ marginLeft: 4 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Thân màn hình chia làm 2 phần: Camera và Panel nhập liệu */}
        <View style={styles.body} onLayout={onLayout}>
          <CameraSection camRef={camRef} on={camOn} h={camH} onSnap={takePhoto} onReq={reqCam} colors={colors} />
          <InputPanel
            h={inH} pan={pan.panHandlers} content={text} onText={setText}
            tags={tags} newTag={newTag} isTagging={isTagging} onTagChange={setNewTag} onAddTag={addTag}
            onRemoveTag={(t) => setTags(tags.filter(tag => tag !== t))} onShowTag={() => setIsTagging(true)}
            type={type} preview={preview} audio={audio} recording={isRec}
            onPickImg={() => pickMedia(ImagePicker.MediaTypeOptions.Images, MomentType.PHOTO)}
            onPickVid={() => pickMedia(ImagePicker.MediaTypeOptions.Videos, MomentType.VIDEO)}
            onToggleRec={toggleRec} onRemoveMedia={() => setPreview(null)} onRemoveAudio={() => setAudio(null)}
            moodScore={moodScore} onMoodSelect={setMoodScore}
            userGroups={userGroups}
            destinations={destinations}
            onToggleDestination={(id) => {
              setDestinations(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
            }}
            colors={colors}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  btn: { padding: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  save: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveText: { fontSize: 14, fontWeight: '500' },
  body: { flex: 1 },
});

export default CreateScreen;
