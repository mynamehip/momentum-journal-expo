import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedCardProps {
  colors: any;
}

const FeedCard: React.FC<FeedCardProps> = ({ colors }) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>John Doe</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>2 hours ago</Text>
        </View>
      </View>
      <Text style={[styles.content, { color: colors.text }]}>
        Just finished a marathon! Feeling exhausted but incredibly proud. 🏃‍♂️💨
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>3</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  userInfo: { marginLeft: 8 },
  userName: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 10 },
  content: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 4, fontSize: 12 },
});

export default FeedCard;
