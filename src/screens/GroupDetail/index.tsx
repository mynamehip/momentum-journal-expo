import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Share, Alert, TextInput, Animated, ActivityIndicator, Platform } from 'react-native';
import * as htmlToImage from 'html-to-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { JournalEntry, Group } from '../../types';
import { getGroupEntries, leaveGroup, setLocalGroupName, deleteGroupEntry } from '../../services/dataService';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { JournalCard } from '../../components';
import { formatDate, isToday, getMoodEmoji } from '../../utils';
import DayGroupHeader from '../Home/DayGroupHeader';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';

type RootStackParamList = {
  MainTabs: undefined;
  EntryDetail: { entry: JournalEntry };
  GroupDetail: { group: Group };
};

type GroupDetailRoute = RouteProp<RootStackParamList, 'GroupDetail'>;

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  entries: JournalEntry[];
}

const GroupDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRoute>();
  const { group } = route.params;

  const [data, setData] = useState<JournalEntry[]>([]);
  const [refing, setRefing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [localName, setLocalName] = useState(group.localName || group.name);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(localName);

  // Options Modal State
  const [showOptions, setShowOptions] = useState(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const cardRefs = useRef<Record<string, any>>({});

  const load = useCallback(async () => {
    const list = await getGroupEntries(group.id);
    setData(list);
  }, [group.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRef = async () => {
    setRefing(true);
    await load();
    setRefing(false);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Tham gia nhóm nhật ký "${localName}" cùng tôi trên Momentum Journal!\nMã tham gia: ${group.joinCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || !user) return;
    await setLocalGroupName(group.id, user.uid, newName.trim());
    setLocalName(newName.trim());
    setShowRename(false);
  };

  const handleLeave = async () => {
    if (!user) return;
    Alert.alert(
      'Rời nhóm',
      'Bạn có chắc muốn rời khỏi nhóm này? Bạn sẽ không thể xem lại các bài viết trong nhóm trừ khi tham gia lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Rời nhóm', 
          style: 'destructive', 
          onPress: async () => {
            await leaveGroup(group.id, user.uid);
            navigation.goBack();
          }
        }
      ]
    );
  };

  // --- Chức năng Lưu/Xóa bài viết (Long Press) ---
  const openOptions = (e: JournalEntry) => {
    setActiveEntry(e);
    setShowOptions(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
  };

  const closeOptions = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 100, useNativeDriver: true }).start(() => {
      setShowOptions(false);
      setActiveEntry(null);
    });
  };

  const saveCardAsImage = async (entryId: string) => {
    if (Platform.OS === 'web') {
      const node = cardRefs.current[entryId];
      if (node) {
        try {
          // html-to-image chụp lại toàn bộ cấu trúc DOM của thẻ Card
          const dataUrl = await htmlToImage.toPng(node);
          const link = document.createElement('a');
          link.download = `moment-${entryId}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Thành công', 'Đã tải ảnh bài viết về máy!');
        } catch (error) {
          console.error('Web capture error:', error);
          // Fallback nếu có lỗi chụp ảnh thì tải file thô
          const entry = data.find(item => item.id === entryId);
          if (entry?.mediaUrl) {
            const link = document.createElement('a');
            link.href = entry.mediaUrl;
            link.target = '_blank';
            link.click();
            Alert.alert('Thành công', 'Đã mở hình ảnh trong tab mới để lưu.');
          } else {
            Alert.alert('Lỗi', 'Không thể lưu ảnh bài viết.');
          }
        }
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy thẻ bài viết để lưu.');
      }
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') return Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      const uri = await captureRef(cardRefs.current[entryId], { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Thành công', 'Đã lưu ảnh vào thư viện!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu ảnh.');
    }
  };

  const confirmDelete = () => {
    if (!activeEntry) return;
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: async () => {
          await deleteGroupEntry(group.id, activeEntry.id);
          closeOptions();
          load();
        } 
      }
    ]);
  };

  const groups: DayGroup[] = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    data.forEach(e => {
      const { dateKey } = formatDate(e.createdAt);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return Object.entries(map).map(([dateKey, items]) => ({
      dateKey,
      dateLabel: isToday(dateKey) ? 'Hôm nay' : dateKey,
      entries: items.sort((a, b) => b.createdAt - a.createdAt),
    }));
  }, [data]);

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {localName}
        </Text>
        <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.iconBtn}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="journal-outline" size={48} color={colors.textSecondary + '40'} />
            <Text style={[styles.emptyT, { color: colors.text }]}>Nhóm chưa có bài viết nào</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={it => it.dateKey}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingLeft: 8 }}
            refreshControl={<RefreshControl refreshing={refing} onRefresh={onRef} tintColor={colors.primary} />}
            renderItem={({ item: g, index }) => (
              <View style={styles.groupWrapper}>
                <View style={styles.timelineHeader}>
                  <View style={[styles.timelineLine, { backgroundColor: colors.border, top: 20 }]} />
                  <View style={[styles.timelineNodeLarge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                    <Ionicons name="calendar" size={12} color="white" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <DayGroupHeader dateKey={g.dateKey} dateLabel={g.dateLabel} entries={g.entries} colors={colors} />
                  </View>
                </View>

                {g.entries.map((e, idx) => (
                  <View key={e.id} style={styles.timelineItem}>
                    <View 
                      style={[
                        styles.timelineLine, 
                        { 
                          backgroundColor: colors.border,
                          bottom: (index === groups.length - 1 && idx === g.entries.length - 1) ? '50%' : -20 
                        }
                      ]} 
                    />
                    
                    <View style={[styles.timelineNodeMood, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 16 }}>{getMoodEmoji(e.moodScore)}</Text>
                    </View>
                    
                    <View style={styles.cardWrapper}>
                      <JournalCard 
                        ref={(r: any) => { if (r) cardRefs.current[e.id] = r; }}
                        entry={e} 
                        onPress={() => navigation.navigate('EntryDetail', { entry: e })} 
                        onLongPress={() => openOptions(e)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          />
        )}
      </View>

      {/* Info Modal */}
      <Modal visible={showInfo} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.mHead}>
              <Text style={[styles.mTitle, { color: colors.text }]}>Thông tin nhóm</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            
            <View style={styles.mBody}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.gName, { color: colors.text, flex: 1 }]}>{localName}</Text>
                <TouchableOpacity onPress={() => setShowRename(true)} style={{ padding: 8 }}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {group.description ? <Text style={[styles.gDesc, { color: colors.textSecondary }]}>{group.description}</Text> : null}
              
              <View style={[styles.codeBox, { backgroundColor: colors.inputBackground }]}>
                <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Mã tham gia</Text>
                <Text style={[styles.codeVal, { color: colors.primary }]}>{group.joinCode}</Text>
                <TouchableOpacity onPress={onShare} style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Chia sẻ mã</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleLeave} style={[styles.leaveBtn, { borderColor: colors.danger }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={[styles.leaveText, { color: colors.danger }]}>Rời khỏi nhóm</Text>
              </TouchableOpacity>

              <Text style={[styles.mSub, { color: colors.text }]}>Thành viên ({group.members.length})</Text>
              {/* Về sau có thể fetch user info để hiển thị avatar/tên. Hiện tại chỉ hiện số lượng */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {group.members.map(mId => (
                  <View key={mId} style={[styles.mTag, { backgroundColor: colors.border }]}>
                    <Ionicons name="person" size={12} color={colors.textSecondary} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={showRename} animationType="fade" transparent>
        <View style={styles.modalBgCenter}>
          <View style={[styles.modalBoxSmall, { backgroundColor: colors.card }]}>
            <Text style={[styles.mTitle, { color: colors.text, marginBottom: 16 }]}>Đổi tên nhóm (Local)</Text>
            <TextInput 
              value={newName} 
              onChangeText={setNewName} 
              placeholder="Nhập tên mới..." 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.mBtns}>
              <TouchableOpacity onPress={() => setShowRename(false)} style={styles.mBtn}><Text style={{ color: colors.textSecondary }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={[styles.mBtn, { backgroundColor: colors.primary, borderRadius: 8 }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Lưu</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal (Save/Delete) */}
      <Modal visible={showOptions} transparent animationType="none">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalBgClick} activeOpacity={1} onPress={closeOptions} />
          <Animated.View style={[styles.optionSheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            
            <TouchableOpacity 
              style={styles.sheetItem} 
              onPress={() => { closeOptions(); saveCardAsImage(activeEntry?.id || ''); }}
            >
              <View style={[styles.sheetIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="download-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.sheetText, { color: colors.text }]}>Lưu bài viết thành ảnh</Text>
            </TouchableOpacity>

            {activeEntry?.userId === user?.uid && (
              <TouchableOpacity style={styles.sheetItem} onPress={confirmDelete}>
                <View style={[styles.sheetIcon, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.sheetText, { color: '#ef4444' }]}>Xóa bài viết</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.inputBackground }]} onPress={closeOptions}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Hủy</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  iconBtn: { padding: 4 },
  body: { flex: 1, paddingRight: 16, paddingTop: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyT: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  
  groupWrapper: { marginBottom: 8 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  timelineItem: { flexDirection: 'row', position: 'relative', paddingLeft: 0 },
  timelineLine: { position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, zIndex: -1 },
  timelineNodeLarge: { width: 32, height: 32, borderRadius: 16, borderWidth: 4, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineNodeMood: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, position: 'absolute', left: 1, top: 24, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  cardWrapper: { flex: 1, marginLeft: 48, marginRight: 10, marginBottom: 12 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBgClick: { ...StyleSheet.absoluteFillObject },
  optionSheet: { width: '100%', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  sheetIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sheetText: { fontSize: 16, fontWeight: '500' },
  cancelBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: 'bold' },
  modalBox: { width: '100%', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  mHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mTitle: { fontSize: 18, fontWeight: 'bold' },
  mBody: { paddingBottom: 20 },
  gName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  gDesc: { fontSize: 14, marginBottom: 20 },
  codeBox: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  codeLabel: { fontSize: 12, marginBottom: 4 },
  codeVal: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4, marginBottom: 16 },
  shareBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  mSub: { fontSize: 16, fontWeight: 'bold' },
  mTag: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 12, gap: 8 },
  leaveText: { fontSize: 14, fontWeight: 'bold' },
  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBoxSmall: { width: '100%', padding: 20, borderRadius: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
  mBtn: { paddingVertical: 10, paddingHorizontal: 16 },
});

export default GroupDetailScreen;
