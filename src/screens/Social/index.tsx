import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { Group } from '../../types';
import { getUserGroups, createGroup, joinGroup } from '../../services/dataService';

const GroupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, goToLogin } = useAuth();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [code, setCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await getUserGroups(user.uid);
    setGroups(list);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadGroups(); }, [loadGroups]));

  const handleCreate = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await createGroup('', desc, user.uid);
      setShowCreate(false);
      setDesc('');
      loadGroups();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo nhóm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim() || !user) return;
    setActionLoading(true);
    try {
      const res = await joinGroup(code, user.uid);
      if (res) {
        setShowJoin(false);
        setCode('');
        loadGroups();
      } else {
        alert('Không tìm thấy nhóm với mã này');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tham gia nhóm');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.main, { backgroundColor: colors.background }]}>
        <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
          <Text style={[styles.title, { color: colors.text }]}>Nhóm của tôi</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary + '40'} />
          <Text style={[styles.emptyT, { color: colors.text }]}>Yêu cầu đăng nhập</Text>
          <Text style={[styles.emptyS, { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 }]}>
            Vui lòng đăng nhập để tạo nhóm, chia sẻ nhật ký và kết nối với bạn bè.
          </Text>
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: colors.primary }]} 
            onPress={goToLogin}
          >
            <Text style={styles.loginBtnT}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={[styles.title, { color: colors.text }]}>Nhóm của tôi</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setShowJoin(true)} style={styles.iconBtn}>
            <Ionicons name="enter-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.iconBtn}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary + '40'} />
          <Text style={[styles.emptyT, { color: colors.text }]}>Bạn chưa tham gia nhóm nào</Text>
          <Text style={[styles.emptyS, { color: colors.textSecondary }]}>Tạo hoặc tham gia nhóm để bắt đầu</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('GroupDetail', { group: item })}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarT, { color: colors.primary }]}>{(item.localName || item.name).charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.gName, { color: colors.text }]}>{item.localName || item.name}</Text>
                <Text style={[styles.gDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.members.length} thành viên {item.description ? `• ${item.description}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.mTitle, { color: colors.text }]}>Tạo nhóm mới</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>Tên nhóm sẽ được tạo tự động từ mã Join Code.</Text>
            <TextInput value={desc} onChangeText={setDesc} placeholder="Mô tả nhóm (tùy chọn)" style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textSecondary} />
            <View style={styles.mBtns}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.mBtn}><Text style={{ color: colors.textSecondary }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={actionLoading} style={[styles.mBtn, { backgroundColor: colors.primary, borderRadius: 8 }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Tạo</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoin} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.mTitle, { color: colors.text }]}>Tham gia nhóm</Text>
            <TextInput value={code} onChangeText={setCode} placeholder="Nhập mã nhóm (6 ký tự)" autoCapitalize="characters" style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholderTextColor={colors.textSecondary} />
            <View style={styles.mBtns}>
              <TouchableOpacity onPress={() => setShowJoin(false)} style={styles.mBtn}><Text style={{ color: colors.textSecondary }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleJoin} disabled={actionLoading} style={[styles.mBtn, { backgroundColor: colors.primary, borderRadius: 8 }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Tham gia</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  iconBtn: { padding: 4 },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarT: { fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  gName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  gDesc: { fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyT: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptyS: { fontSize: 14, marginTop: 8 },
  loginBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  loginBtnT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', padding: 20, borderRadius: 16 },
  mTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
  mBtn: { paddingVertical: 10, paddingHorizontal: 16 },
});

export default GroupScreen;
