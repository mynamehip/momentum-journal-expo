import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { JournalEntry, MomentType } from '../../types';
import { useTheme, MOOD_COLORS } from '../../theme';
import { getMoodEmoji, getPrivacyLabel, optimizeCloudinaryUrl } from '../../utils';

type EntryDetailRoute = RouteProp<{ EntryDetail: { entry: JournalEntry } }, 'EntryDetail'>;

const EntryDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<EntryDetailRoute>();
  const insets = useSafeAreaInsets();
  
  // Lấy dữ liệu entry từ params của route
  const { entry } = route.params;
  const date = new Date(entry.createdAt);
  
  // Tính toán màu sắc tâm trạng (mood) dựa trên điểm số
  const moodCol = MOOD_COLORS[Math.max(1, Math.min(9, Math.round(entry.moodScore)))] || '#66BB6A';
  
  // --- Xử lý Audio ---
  const [audioSource, setAudioSource] = useState(() => {
    if (Platform.OS === 'web') {
      return entry.mediaUrl || entry.localUri;
    }
    return entry.localUri || entry.mediaUrl;
  });
  const aSource: AudioSource | null = audioSource ? { uri: audioSource } : null;
  const audio = useAudioPlayer(aSource);
  
  // --- Xử lý Video ---
  const [videoSource, setVideoSource] = useState(() => {
    if (Platform.OS === 'web') {
      return entry.mediaUrl || entry.localUri;
    }
    return entry.localUri || entry.mediaUrl;
  });
  const video = useVideoPlayer(videoSource || null, player => {
    player.loop = true;
    player.play();
  });

  // Tự động chuyển đổi video sang link đám mây nếu link nội bộ bị lỗi
  useEffect(() => {
    if (video.status === 'error' && videoSource !== entry.mediaUrl && entry.mediaUrl) {
      setVideoSource(entry.mediaUrl);
      video.replaceAsync(entry.mediaUrl).then(() => {
        video.play();
      }).catch(err => console.error('Error fallback video:', err));
    }
  }, [video.status, videoSource, entry.mediaUrl]);

  // --- Xử lý Ảnh ---
  const [imgUri, setImgUri] = useState(() => {
    if (Platform.OS === 'web') {
      return entry.mediaUrl || entry.localUri;
    }
    return entry.localUri || entry.mediaUrl;
  });

  useEffect(() => {
    const target = Platform.OS === 'web' ? (entry.mediaUrl || entry.localUri) : (entry.localUri || entry.mediaUrl);
    setAudioSource(target);
    setVideoSource(target);
    setImgUri(target);
  }, [entry.localUri, entry.mediaUrl]);

  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  useEffect(() => {
    const mainUri = Platform.OS === 'web' ? (entry.mediaUrl || entry.localUri) : (entry.localUri || entry.mediaUrl);
    if (entry.type === MomentType.PHOTO && mainUri) {
      Image.getSize(
        mainUri,
        (width, height) => {
          if (width && height) setAspectRatio(width / height);
        },
        (error) => console.error('Error getting image size:', error)
      );
    }
  }, [entry.localUri, entry.mediaUrl, entry.type]);

  // Hàm bật/tắt âm thanh
  const onAudio = () => {
    if (!audio) return;
    audio.playing ? audio.pause() : audio.play();
  };

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      {/* Thanh Header */}
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headTitle, { color: colors.text }]}>Chi tiết Moment</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Thẻ thông tin chính (Mood, Ngày tháng, Quyền riêng tư) */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroLeft}>
            <View style={[styles.moodWrap, { backgroundColor: moodCol + '20' }]}>
              <Text style={styles.emoji}>{getMoodEmoji(entry.moodScore)}</Text>
            </View>
            <View>
              <Text style={[styles.date, { color: colors.text }]}>
                {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {entry.type} • {getPrivacyLabel(entry.privacy)}
              </Text>
            </View>
          </View>
        </View>

        {/* Hiển thị Ảnh */}
        {(entry.localUri || entry.mediaUrl) && entry.type === MomentType.PHOTO && (
          <Image 
            source={{ uri: imgUri }} 
            onError={() => {
              if (imgUri !== entry.mediaUrl && entry.mediaUrl) {
                setImgUri(entry.mediaUrl);
              }
            }}
            style={[styles.media, { aspectRatio }]} 
            resizeMode="contain" 
          />
        )}

        {/* Hiển thị Video */}
        {entry.mediaUrl && entry.type === MomentType.VIDEO && (
          <VideoView
            player={video}
            style={styles.media}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            nativeControls={true}
          />
        )}

        {/* Hiển thị Audio Player */}
        {entry.mediaUrl && entry.type === MomentType.AUDIO && (
          <View style={[styles.audio, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aLeft}>
              <View style={[styles.aIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="mic" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.aTitle, { color: colors.text }]}>Ghi âm thanh</Text>
                <Text style={[styles.aSub, { color: colors.textSecondary }]}>Nhấn để nghe</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onAudio} style={[styles.aBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name={audio?.playing ? 'pause' : 'play'} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Hiển thị nội dung văn bản (Caption) */}
        {!!entry.content && (
          <View style={[styles.sect, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectBody, { color: colors.text }]}>{entry.content}</Text>
          </View>
        )}

        {/* Danh sách thẻ Tag */}
        {entry.tags.length > 0 && (
          <View style={styles.tags}>
            {entry.tags.map((tag, idx) => (
              <View key={`tag-${idx}`} style={[styles.tag, { backgroundColor: colors.inputBackground }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontSize: 16, fontWeight: '600' },
  spacer: { width: 32 },
  body: { padding: 16 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  date: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  score: { fontSize: 12, fontWeight: '600' },
  media: { width: '100%', minHeight: 200, borderRadius: 12, marginBottom: 16, backgroundColor: '#000' },
  audio: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  aLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  aTitle: { fontSize: 14, fontWeight: '600' },
  aSub: { fontSize: 12, marginTop: 2 },
  aBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sect: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  sectBody: { fontSize: 14, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12 },
});

export default EntryDetailScreen;
