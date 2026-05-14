import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { getEntries } from '../../services/dataService';
import { JournalEntry, MomentType } from '../../types';
import { getMoodEmoji } from '../../utils';

const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // --- State quản lý dữ liệu ---
  const [data, setData] = useState<JournalEntry[]>([]); // Danh sách các bài nhật ký

  // Tải dữ liệu khi màn hình được khởi tạo
  useEffect(() => {
    const load = async () => {
      const result = await getEntries(user?.uid || null, 100); // Lay nhieu hon de thong ke chinh xac hon
      setData(result.entries);
    };
    load();
  }, [user?.uid]);

  // --- Logic tính toán số liệu thống kê ---

  // 1. Tính toán điểm tâm trạng trung bình theo từng thứ trong tuần
  const week = useMemo(() => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const temp = days.map(d => ({ name: d, mood: 0, count: 0 }));
    
    if (!data || !Array.isArray(data)) return temp.map(d => ({ name: d.name, avg: 0 }));

    data.forEach(e => {
      const d = new Date(e.createdAt);
      if (temp[d.getDay()]) {
        temp[d.getDay()].mood += e.moodScore;
        temp[d.getDay()].count += 1;
      }
    });
    
    return temp.map(d => ({ 
      name: d.name, 
      avg: d.count > 0 ? parseFloat((d.mood / d.count).toFixed(1)) : 0 
    }));
  }, [data]);

  // 2. Tính toán điểm tâm trạng trung bình tổng thể
  const avg = useMemo(() => {
    if (!data || data.length === 0 || !Array.isArray(data)) return 0;
    const sum = data.reduce((acc, e) => acc + e.moodScore, 0);
    return parseFloat((sum / data.length).toFixed(1));
  }, [data]);

  // 3. Đếm số lượng theo loại Moment
  const types = useMemo(() => {
    const counts = { [MomentType.TEXT]: 0, [MomentType.PHOTO]: 0, [MomentType.VIDEO]: 0, [MomentType.AUDIO]: 0 };
    if (!data || !Array.isArray(data)) return Object.entries(counts).map(([k, v]) => ({ name: k, count: v }));
    
    data.forEach(e => {
      if (counts[e.type] !== undefined) counts[e.type] += 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: k, count: v }));
  }, [data]);

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={[styles.title, { color: colors.text }]}>Phân Tích</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Thẻ hiển thị điểm trung bình tổng quát (Hero Card) */}
        <View style={[styles.hero, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <View style={styles.heroContent}>
            <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.7)' }]}>Tâm trạng trung bình</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroEmoji}>{getMoodEmoji(Math.round(avg))}</Text>
              <Text style={[styles.heroValue, { color: '#fff' }]}>{avg} <Text style={[styles.heroUnit, { color: 'rgba(255,255,255,0.6)' }]}>/ 8</Text></Text>
            </View>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="trending-up" size={24} color="#fff" />
          </View>
        </View>

        {/* Biểu đồ dòng chảy tâm trạng trong tuần */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Dòng chảy tâm trạng tuần</Text>
          </View>
          
          <View style={styles.chart}>
            {week.map((d, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={styles.barBox}>
                  {/* Cột biểu đồ: Chiều cao dựa trên điểm trung bình (0-10) */}
                  <View style={[
                    styles.bar, 
                    { 
                      height: d.avg > 0 ? `${(d.avg / 8) * 100}%` : 4, 
                      backgroundColor: d.avg > 0 ? colors.primary : colors.border 
                    }
                  ]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{d.name}</Text>
                {d.avg > 0 && <Text style={{ fontSize: 14, marginTop: 4 }}>{getMoodEmoji(Math.round(d.avg))}</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  body: { flex: 1, padding: 16 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderRadius: 16, marginBottom: 16, backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  heroContent: { flex: 1 },
  heroLabel: { color: '#c7d2fe', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  heroValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroEmoji: { fontSize: 32 },
  heroValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  heroUnit: { fontSize: 14, opacity: 0.7 },
  heroIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 24 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barWrap: { flex: 1, alignItems: 'center' },
  barBox: { height: 100, width: 24, justifyContent: 'flex-end', marginBottom: 8 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10 },
  barVal: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});

export default StatsScreen;
