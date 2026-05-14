import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateItem {
  dateKey: string;
  count: number;
}

interface DatePickerProps {
  dateItems: DateItem[];
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
  colors: any;
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const formatLabel = (dateKey: string): string => {
  const d = new Date(dateKey + 'T00:00:00');
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
};

const DatePicker: React.FC<DatePickerProps> = ({ dateItems, selectedDate, onSelectDate, colors }) => {
  const [visible, setVisible] = useState(false);

  const handleSelect = (dateKey: string | null) => {
    onSelectDate(dateKey);
    setVisible(false);
  };

  const buttonLabel = selectedDate ? formatLabel(selectedDate) : 'Tất cả';

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.trigger]}>
        <Text style={[styles.triggerText, { color: colors.text }]}>{buttonLabel}</Text>
      </TouchableOpacity>

      {/* Dropdown modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>Chọn ngày</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* "All" option */}
            <TouchableOpacity
              onPress={() => handleSelect(null)}
              style={[styles.dateRow, { borderBottomColor: colors.border }, selectedDate === null && { backgroundColor: colors.primary + '10' }]}
            >
              <View style={styles.dateRowLeft}>
                <Ionicons name="layers-outline" size={16} color={selectedDate === null ? colors.primary : colors.textSecondary} />
                <Text style={[styles.dateLabel, { color: selectedDate === null ? colors.primary : colors.text }]}>Tất cả ngày</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: selectedDate === null ? colors.primary : colors.inputBackground }]}>
                <Text style={[styles.countText, { color: selectedDate === null ? '#fff' : colors.textSecondary }]}>
                  {dateItems.reduce((sum, d) => sum + d.count, 0)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Date list */}
            <FlatList
              data={dateItems}
              keyExtractor={item => item.dateKey}
              style={styles.list}
              renderItem={({ item }) => {
                const isActive = selectedDate === item.dateKey;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.dateKey)}
                    style={[styles.dateRow, { borderBottomColor: colors.border }, isActive && { backgroundColor: colors.primary + '10' }]}
                  >
                    <View style={styles.dateRowLeft}>
                      <View style={[styles.dateDot, { backgroundColor: isActive ? colors.primary : colors.textSecondary + '40' }]} />
                      <Text style={[styles.dateLabel, { color: isActive ? colors.primary : colors.text }]}>{formatLabel(item.dateKey)}</Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: isActive ? colors.primary : colors.inputBackground }]}>
                      <Text style={[styles.countText, { color: isActive ? '#fff' : colors.textSecondary }]}>{item.count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  triggerText: { fontSize: 20, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 110,
    paddingHorizontal: 16,
  },
  dropdown: {
    borderRadius: 14,
    borderWidth: 1,
    maxHeight: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownTitle: { fontSize: 16, fontWeight: '700' },
  list: { maxHeight: 300 },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  dateRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateDot: { width: 8, height: 8, borderRadius: 4 },
  dateLabel: { fontSize: 14, fontWeight: '500' },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: { fontSize: 12, fontWeight: '700' },
});

export default DatePicker;
