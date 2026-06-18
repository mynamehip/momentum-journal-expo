import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, Animated, ActivityIndicator, DeviceEventEmitter, Platform } from 'react-native';
import * as htmlToImage from 'html-to-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { JournalEntry } from '../../types';
import { getEntries, deleteEntry } from '../../services/dataService';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { JournalCard } from '../../components';
import { formatDate, isToday, getMoodEmoji } from '../../utils';
import DayGroupHeader from './DayGroupHeader';
import SearchBar from './SearchBar';
import DatePicker from './DatePicker';

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  entries: JournalEntry[];
}


const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // --- State quản lý dữ liệu và UI ---
  const [data, setData] = useState<JournalEntry[]>([]); // Toàn bộ entries
  const [q, setQ] = useState(''); // Chuỗi tìm kiếm (query)
  const [refing, setRefing] = useState(false); // Trạng thái làm mới (refresh)
  const [sDate, setSDate] = useState<string | null>(null); // Ngày đang chọn để lọc
  const [isQ, setIsQ] = useState(false); // Trạng thái mở thanh tìm kiếm
  const cardRefs = useRef<Record<string, any>>({});

  // --- State phân trang ---
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State cho Modal tùy chọn (Save/Delete)
  const [showOptions, setShowOptions] = useState(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current; // Vi tri bat dau cua sheet (ngoai man hinh)
  

  // Ham mo Modal voi animation
  const openOptions = (e: JournalEntry) => {
    setActiveEntry(e);
    setShowOptions(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  // Ham dong Modal voi animation
  const closeOptions = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      setShowOptions(false);
      setActiveEntry(null);
    });
  };

  // Tải dữ liệu từ database (trang đầu tiên)
  const load = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setRefing(true);
    const result = await getEntries(user?.uid || null, 15, null);
    setData(result.entries);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    if (isRefresh) setRefing(false);
  }, [user?.uid]);

  // Tải thêm dữ liệu (trang tiếp theo)
  const loadMore = async () => {
    if (!hasMore || loadingMore || refing) return;
    
    setLoadingMore(true);
    const result = await getEntries(user?.uid || null, 15, lastDoc);
    
    setData(prev => [...prev, ...result.entries]);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  };

  // Tự động tải lại dữ liệu khi màn hình được focus
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Lang nghe su kien lam moi du lieu tu Modal Create
  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('refresh_home', () => {
      console.log('HomeScreen: Nhận tín hiệu refresh_home, đang tải lại...');
      load();
    });
    return () => sub.remove();
  }, [load]);

  // Xử lý kéo để làm mới (Pull to refresh)
  const onRef = () => {
    load(true);
  };

  // --- Chức năng Lưu/Xóa bài viết ---

  // Lưu ảnh Card vào thư viện ảnh
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
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để lưu.');
        return;
      }

      const uri = await captureRef(cardRefs.current[entryId], {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Thành công', 'Đã lưu ảnh vào thư viện!');
    } catch (error) {
      console.error('Save card error:', error);
      Alert.alert('Lỗi', 'Không thể lưu ảnh bài viết.');
    }
  };

  // Xử lý khi nhấn giữ bài viết
  const handleLongPress = (e: JournalEntry) => {
    openOptions(e);
  };

  const confirmDelete = () => {
    if (!activeEntry) return;
    Alert.alert(
      'Xac nhan xoa',
      'Ban co chac chan muon xoa khoanh khac nay khong?',
      [
        { text: 'Huy', style: 'cancel' },
        { 
          text: 'Xoa', 
          style: 'destructive', 
          onPress: async () => {
            await deleteEntry(user?.uid, activeEntry.id);
            closeOptions();
            load();
          } 
        }
      ]
    );
  };

  // 1. Lọc dữ liệu theo từ khóa tìm kiếm (content hoặc tags)
  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!q.trim()) return data;
    const lowQ = q.toLowerCase();
    return data.filter(e => 
      e.content.toLowerCase().includes(lowQ) || 
      e.tags.some(t => t.toLowerCase().includes(lowQ))
    );
  }, [data, q]);

  // 2. Lấy danh sách các ngày có bài viết để hiển thị trong dropdown bộ lọc
  const dates = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const counts: Record<string, number> = {};
    data.forEach(e => {
      const { dateKey } = formatDate(e.createdAt);
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, count]) => ({ dateKey, count }));
  }, [data]);

  // 3. Lọc tiếp theo ngày đã chọn từ DatePicker
  const finalData = useMemo(() => {
    return sDate ? filtered.filter(e => formatDate(e.createdAt).dateKey === sDate) : filtered;
  }, [filtered, sDate]);

  // 4. Nhóm các bài viết theo ngày để hiển thị dạng danh sách phân đoạn
  const groups: DayGroup[] = useMemo(() => {
    if (!finalData || !Array.isArray(finalData)) return [];
    const map: Record<string, JournalEntry[]> = {};
    finalData.forEach(e => {
      const { dateKey } = formatDate(e.createdAt);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return Object.entries(map).map(([dateKey, items]) => ({
      dateKey,
      dateLabel: isToday(dateKey) ? 'Hôm nay' : dateKey,
      entries: items.sort((a, b) => b.createdAt - a.createdAt),
    }));
  }, [finalData]);

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      {/* Header: Chứa bộ lọc ngày, Tiêu đề và Nút tìm kiếm */}
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <DatePicker dateItems={dates} selectedDate={sDate} onSelectDate={setSDate} colors={colors} />
        <View style={styles.hRight}>
          <TouchableOpacity 
            onPress={() => { setIsQ(!isQ); if (isQ) setQ(''); }} 
            style={[styles.qBtn, { backgroundColor: isQ ? colors.primary + '15' : 'transparent' }]}
          >
            <Ionicons name={isQ ? 'close' : 'search'} size={18} color={isQ ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thanh tìm kiếm (chỉ hiện khi nhấn icon search) */}
      {isQ && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.card }}>
          <SearchBar value={q} onChangeText={setQ} colors={colors} />
        </View>
      )}

      <View style={styles.body}>
        {groups.length === 0 ? (
          /* Giao diện khi không có bài viết nào */
          <View style={styles.empty}>
            <Ionicons name="journal-outline" size={48} color={colors.textSecondary + '40'} />
            <Text style={[styles.emptyT, { color: colors.text }]}>Chưa có khoảnh khắc nào</Text>
            <Text style={[styles.emptyS, { color: colors.textSecondary }]}>Nhấn + để ghi lại kỉ niệm đầu tiên</Text>
          </View>
        ) : (
          /* Danh sách bài viết được nhóm theo ngày */
          <FlatList
            data={groups}
            keyExtractor={it => it.dateKey}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingLeft: 8 }}
            refreshControl={<RefreshControl refreshing={refing} onRefresh={onRef} tintColor={colors.primary} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            )}
            renderItem={({ item: group, index }) => (
              <View style={styles.groupWrapper}>
                {/* Group Header with Large Node */}
                <View style={styles.timelineHeader}>
                  <View style={[styles.timelineLine, { backgroundColor: colors.border, top: 20 }]} />
                  <View style={[styles.timelineNodeLarge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                    <Ionicons name="calendar" size={12} color="white" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <DayGroupHeader dateKey={group.dateKey} dateLabel={group.dateLabel} entries={group.entries} colors={colors} />
                  </View>
                </View>

                {/* Journal Entries with Small Nodes */}
                {group.entries.map((e, idx) => (
                  <View key={e.id} style={styles.timelineItem}>
                    {/* Vertical line connecting nodes */}
                    <View 
                      style={[
                        styles.timelineLine, 
                        { 
                          backgroundColor: colors.border,
                          // Nếu là item cuối cùng của group cuối cùng thì thu ngắn đường kẻ lại
                          bottom: (index === groups.length - 1 && idx === group.entries.length - 1) ? '50%' : -20 
                        }
                      ]} 
                    />
                    
                    {/* Mood Node for each entry */}
                    <View style={[styles.timelineNodeMood, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 16 }}>{getMoodEmoji(e.moodScore)}</Text>
                    </View>
                    
                    <View style={styles.cardWrapper}>
                      <JournalCard 
                        ref={(r) => (cardRefs.current[e.id] = r)}
                        entry={e} 
                        onPress={() => navigation.navigate('EntryDetail', { entry: e })} 
                        onLongPress={() => handleLongPress(e)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          />
        )}
      </View>

      {/* Modal Tuy chon (Bottom Sheet Style) */}
      <Modal visible={showOptions} animationType="fade" transparent onRequestClose={closeOptions}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={closeOptions}>
          <Animated.View 
            style={[
              styles.optionBox, 
              { 
                backgroundColor: colors.card, 
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[styles.optionHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.optionTitle, { color: colors.textSecondary }]}>Tuy chon khoanh khac</Text>
            
            <View style={styles.optionGrid}>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: colors.primary + '10' }]} 
                onPress={() => { activeEntry && saveCardAsImage(activeEntry.id); closeOptions(); }}
              >
                <View style={[styles.gridIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="download-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.gridText, { color: colors.primary }]}>Luu anh</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: '#ef444410' }]} 
                onPress={confirmDelete}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#ef444415' }]}>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </View>
                <Text style={[styles.gridText, { color: '#ef4444' }]}>Xoa bai</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.cancelBtn, { backgroundColor: colors.border + '40' }]} 
              onPress={closeOptions}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Huy bo</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  hRight: { flex: 1, alignItems: 'flex-end' },
  title: { fontSize: 18, fontWeight: 'bold' },
  qBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingRight: 16, paddingTop: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 100 },
  emptyT: { fontSize: 18, fontWeight: '600' },
  emptyS: { fontSize: 14 },
  
  // Timeline Styles
  groupWrapper: {
    marginBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingLeft: 0,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: -1,
  },
  timelineNodeLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineNodeMood: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    position: 'absolute',
    left: 1,
    top: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardWrapper: {
    flex: 1,
    marginLeft: 48,
    marginRight: 10,
    marginBottom: 12,
  },
  
  // Option Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  optionBox: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, alignItems: 'center', width: '100%' },
  optionHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  optionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24 },
  
  optionGrid: { flexDirection: 'row', gap: 16, marginBottom: 24, width: '100%' },
  gridItem: { flex: 1, aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12 },
  gridIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  gridText: { fontSize: 14, fontWeight: 'bold' },

  cancelBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
});

export default HomeScreen;
