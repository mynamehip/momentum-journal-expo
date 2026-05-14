import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JournalEntry } from '../../types';
import { getMoodEmoji, getMoodColor } from '../../utils';

interface DayGroupHeaderProps {
  dateKey: string;
  dateLabel: string;
  entries: JournalEntry[];
  colors: any;
}

const DayGroupHeader: React.FC<DayGroupHeaderProps> = ({ dateKey, dateLabel, entries, colors }) => {
  const avgMood = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length
    : 5;

  return (
    <View style={styles.dayHeader}>
      <Text style={[styles.dayLabel, { color: colors.text }]}>{dateLabel}</Text>
      <Text style={[styles.dayEmoji]}>{getMoodEmoji(avgMood)}</Text>
      <Text style={[styles.dayCount, { color: colors.textSecondary }]}>{entries.length} moments</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  dayEmoji: {
    fontSize: 16,
  },
  dayCount: {
    fontSize: 12,
  },
});

export default DayGroupHeader;
