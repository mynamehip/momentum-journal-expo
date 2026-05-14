import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MomentType, PrivacyLevel, Group } from '../../types';
import { VIETNAMESE_MOODS } from '../../constants/mood';

interface InputPanelProps {
  h: Animated.AnimatedInterpolation<string | number>; // Chiều cao linh hoạt
  pan: any; // Handlers xử lý kéo thả
  content: string; // Nội dung caption
  onText: (t: string) => void;
  tags: string[];
  newTag: string;
  isTagging: boolean;
  onTagChange: (t: string) => void;
  onAddTag: () => void;
  onRemoveTag: (t: string) => void;
  onShowTag: () => void;
  type: MomentType;
  preview: string | null; // Link ảnh/video xem trước
  audio: string | null; // Link file ghi âm
  recording: boolean; // Trạng thái đang ghi âm
  onPickImg: () => void;
  onPickVid: () => void;
  onToggleRec: () => void;
  onRemoveMedia: () => void;
  onRemoveAudio: () => void;
  moodScore: number | null;
  onMoodSelect: (score: number) => void;
  userGroups: Group[];
  destinations: string[];
  onToggleDestination: (id: string) => void;
  colors: any;
}

const InputPanel: React.FC<InputPanelProps> = ({
  h, pan, content, onText,
  tags, newTag, isTagging, onTagChange, onAddTag, onRemoveTag, onShowTag,
  type, preview, audio, recording,
  onPickImg, onPickVid, onToggleRec, onRemoveMedia, onRemoveAudio,
  moodScore, onMoodSelect, userGroups, destinations, onToggleDestination, colors,
}) => {
  return (
    <Animated.View style={[styles.panel, { height: h, backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Thanh nắm (Handle) để người dùng kéo bảng điều khiển lên xuống */}
      <View style={styles.handle} {...pan}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <Text style={[styles.handleText, { color: colors.textSecondary }]}>Vuốt để ẩn hiện</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Xem trước Ảnh */}
        {preview && type === MomentType.PHOTO && (
          <View style={styles.mediaWrap}>
            <Image source={{ uri: preview }} style={styles.img} />
            <TouchableOpacity onPress={onRemoveMedia} style={styles.close}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Xem trước Video (chỉ hiển thị placeholder) */}
        {preview && type === MomentType.VIDEO && (
          <View style={[styles.placeholder, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="videocam" size={28} color={colors.textSecondary} />
            <Text style={[styles.pText, { color: colors.textSecondary }]}>Video selected</Text>
            <TouchableOpacity onPress={onRemoveMedia}><Text style={[styles.link, { color: colors.primary }]}>Remove</Text></TouchableOpacity>
          </View>
        )}

        {/* Xem trước Ghi âm */}
        {audio && (
          <View style={[styles.placeholder, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="mic" size={28} color={colors.textSecondary} />
            <Text style={[styles.pText, { color: colors.textSecondary }]}>Audio recorded</Text>
            <TouchableOpacity onPress={onRemoveAudio}><Text style={[styles.link, { color: colors.primary }]}>Remove</Text></TouchableOpacity>
          </View>
        )}

        {/* Các nút chọn Media nhanh */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onPickImg} style={[styles.btn, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.btnText, { color: colors.text }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPickVid} style={[styles.btn, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="videocam-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.btnText, { color: colors.text }]}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleRec} style={[styles.btn, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name={recording ? 'stop-circle-outline' : 'mic-outline'} size={16} color={colors.textSecondary} />
            <Text style={[styles.btnText, { color: colors.text }]}>{recording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>
        </View>

        {/* Ô nhập văn bản */}
        <TextInput value={content} onChangeText={onText} placeholder="Add a caption..." placeholderTextColor={colors.textSecondary + '60'} style={[styles.input, { color: colors.text }]} multiline textAlignVertical="top" />

        {/* Bộ chọn Mood thủ công */}
        <View style={styles.moodSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodList}>
            {VIETNAMESE_MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => onMoodSelect(m.score)}
                style={[
                  styles.moodItem,
                  { backgroundColor: colors.inputBackground },
                  moodScore === m.score && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
                ]}
              >
                <Text style={styles.moodIcon}>{m.icon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Multi-select Đích đăng */}
        <View style={styles.destSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Đăng vào đâu?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destList}>
            {/* Cá nhân */}
            <TouchableOpacity
              onPress={() => onToggleDestination('personal')}
              style={[
                styles.destItem,
                { backgroundColor: colors.inputBackground },
                destinations.includes('personal') && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Ionicons name="person" size={12} color={destinations.includes('personal') ? colors.primary : colors.textSecondary} />
              <Text style={[styles.destText, { color: destinations.includes('personal') ? colors.primary : colors.textSecondary }]}>Nhật ký cá nhân</Text>
            </TouchableOpacity>

            {/* Các nhóm */}
            {userGroups.map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => onToggleDestination(g.id)}
                style={[
                  styles.destItem,
                  { backgroundColor: colors.inputBackground },
                  destinations.includes(g.id) && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
                ]}
              >
                <Ionicons name="people" size={12} color={destinations.includes(g.id) ? colors.primary : colors.textSecondary} />
                <Text style={[styles.destText, { color: destinations.includes(g.id) ? colors.primary : colors.textSecondary }]}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Các tùy chọn thêm (Thẻ tag) */}
        {/* <View style={styles.row}>
          <TouchableOpacity onPress={onShowTag} style={[styles.opt, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
          </TouchableOpacity>
        </View> */}

        {/* Danh sách các tag đã thêm */}
        <View style={styles.tags}>
          {tags.map((t, i) => (
            <View key={i} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{t}</Text>
              <TouchableOpacity onPress={() => onRemoveTag(t)}><Ionicons name="close" size={12} color={colors.primary} /></TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Input nhập tag mới (chỉ hiện khi nhấn nút Tags) */}
        {isTagging && (
          <View style={styles.tagIn}>
            <TextInput autoFocus value={newTag} onChangeText={onTagChange} onSubmitEditing={onAddTag} placeholder="Enter tag..." placeholderTextColor={colors.textSecondary} style={[styles.tagInput, { color: colors.text, borderBottomColor: colors.primary }]} />
            <TouchableOpacity onPress={onAddTag}><Text style={[styles.addBtn, { color: colors.primary }]}>ADD</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  panel: { width: '100%', borderTopWidth: 1 },
  handle: { height: 40, alignItems: 'center', justifyContent: 'center', gap: 4 },
  grabber: { width: 48, height: 5, borderRadius: 3 },
  handleText: { fontSize: 10, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  mediaWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  img: { width: '100%', aspectRatio: 4 / 3, resizeMode: 'contain' }, // Ép tỉ lệ 4:3 cho ảnh xem trước
  close: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  placeholder: { borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pText: { marginTop: 8, fontSize: 14 },
  link: { marginTop: 8, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  btnText: { fontSize: 12, fontWeight: '500' },
  input: { fontSize: 16, minHeight: 120, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  opt: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  icon: { padding: 4, borderRadius: 10, marginRight: 4 },
  label: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  tagText: { fontSize: 12, marginRight: 6 },
  tagIn: { flexDirection: 'row', alignItems: 'center' },
  tagInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 8, fontSize: 14 },
  addBtn: { marginLeft: 12, fontWeight: 'bold', fontSize: 12 },
  moodSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  moodList: { gap: 10 },
  moodItem: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  moodIcon: { fontSize: 22 },
  destSection: { marginBottom: 24 },
  destList: { gap: 10 },
  destItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 25, gap: 8 },
  destText: { fontSize: 10, fontWeight: '400' },
});

export default InputPanel;
