import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { clearAllData, getDefaultDestinations, setDefaultDestinations, getUserGroups } from '../../services/dataService';
import { Group } from '../../types';
import { APP_VERSION } from '../../constants';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile, isUsernameTaken } from '../../services/dataService';

const SettingsScreen: React.FC = () => {
  const { isDarkMode, toggleTheme, themeType, setThemeType, colors } = useTheme();
  const { logout, user, goToLogin } = useAuth();
  const insets = useSafeAreaInsets();
  
  // --- State quản lý thiết lập ---
  const [isNoti, setIsNoti] = useState(true); // Trạng thái bật/tắt thông báo
  const [showDestModal, setShowDestModal] = useState(false);
  const [defDests, setDefDests] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  
  // Tên người dùng
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Dropdown màu sắc
  const [showColorModal, setShowColorModal] = useState(false);

  // Load user default dests when opening modal
  const openDestModal = async () => {
    if (!user) return;
    const dests = await getDefaultDestinations(user.uid);
    const groups = await getUserGroups(user.uid);
    setDefDests(dests);
    setUserGroups(groups);
    setShowDestModal(true);
  };

  const saveDests = async () => {
    if (user) {
      await setDefaultDestinations(user.uid, defDests.length ? defDests : ['personal']);
    }
    setShowDestModal(false);
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim() || newName.trim() === user.displayName) {
      setShowNameModal(false);
      return;
    }

    if (newName.trim().length < 3) {
      Alert.alert('Lỗi', 'Tên phải có ít nhất 3 ký tự');
      return;
    }

    setNameLoading(true);
    try {
      // Kiểm tra trùng tên (nếu tên khác hiện tại)
      const taken = await isUsernameTaken(newName.trim());
      if (taken) {
        Alert.alert('Lỗi', 'Tên này đã được người khác sử dụng.');
        setNameLoading(false);
        return;
      }

      // Cập nhật Firebase Auth
      await updateProfile(user, { displayName: newName.trim() });
      // Cập nhật Firestore
      await updateUserProfile(user.uid, { name: newName.trim() });
      
      Alert.alert('Thành công', 'Đã cập nhật tên người dùng.');
      setShowNameModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật tên');
    } finally {
      setNameLoading(false);
    }
  };

  const toggleDest = (id: string) => {
    setDefDests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Xử lý xóa toàn bộ dữ liệu nhật ký
  const onClear = () => {
    Alert.alert(
      'Xóa dữ liệu', 
      'Bạn có chắc muốn xóa tất cả dữ liệu nhật ký? Hành động này không thể hoàn tác.', 
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          onPress: async () => { 
            try {
              await clearAllData(user?.uid || null); 
              Alert.alert('Thành công', 'Đã xóa toàn bộ dữ liệu trên cả máy và đám mây.'); 
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa dữ liệu trên đám mây.');
            }
          } 
        },
      ]
    );
  };

  // Danh sách các mục menu thiết lập
  const items = [
    { 
      icon: 'notifications-outline' as const, 
      label: 'Thông báo', 
      toggle: true, 
      isOn: isNoti, 
      action: () => setIsNoti(!isNoti) 
    },
    { 
      icon: 'lock-closed-outline' as const, 
      label: 'Quyền riêng tư & Bảo mật', 
      toggle: false 
    },
    { 
      icon: 'paper-plane-outline' as const, 
      label: 'Đích đăng mặc định', 
      toggle: false,
      action: openDestModal
    },
  ];

  const themes: { type: 'default' | 'pink' | 'aqua' | 'green', label: string, color: string }[] = [
    { type: 'default', label: 'Indigo', color: '#6366f1' },
    { type: 'pink', label: 'Pink', color: '#ec4899' },
    { type: 'aqua', label: 'Aqua', color: '#06b6d4' },
    { type: 'green', label: 'Green', color: '#10b981' },
  ];

  return (
    <View style={[styles.main, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={[styles.title, { color: colors.text }]}>Cài Đặt</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Phần thông tin người dùng */}
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.pInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pName, { color: colors.text }]}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
              <TouchableOpacity onPress={() => { setNewName(user?.displayName || ''); setShowNameModal(true); }} style={{ marginLeft: 8 }}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.pEmail, { color: colors.textSecondary }]}>{user?.email || 'demo@example.com'}</Text>
          </View>
        </View>

        {/* Thẻ Menu cài đặt */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((it, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={it.action} 
              style={[styles.item, i !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.icon, { backgroundColor: colors.inputBackground }]}>
                  <Ionicons name={it.icon} size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{it.label}</Text>
              </View>
              
              {it.toggle ? (
                <Switch 
                  value={it.isOn} 
                  onValueChange={it.action} 
                  trackColor={{ false: colors.border, true: colors.primary + '80' }} 
                  thumbColor={it.isOn ? colors.primary : colors.textSecondary} 
                />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Phần Giao diện (Chế độ & Màu sắc) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Giao diện & Chủ đề</Text>
        <View style={[styles.appearanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Chọn Sáng/Tối */}
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceInfo}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={colors.text} />
              <Text style={[styles.appearanceLabel, { color: colors.text }]}>Chế độ hiển thị</Text>
            </View>
            <View style={[styles.segmentContainer, { backgroundColor: colors.inputBackground }]}>
              <TouchableOpacity 
                onPress={() => isDarkMode && toggleTheme()} 
                style={[styles.segmentBtn, !isDarkMode && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.segmentText, !isDarkMode ? { color: '#fff' } : { color: colors.textSecondary }]}>Sáng</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => !isDarkMode && toggleTheme()} 
                style={[styles.segmentBtn, isDarkMode && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.segmentText, isDarkMode ? { color: '#fff' } : { color: colors.textSecondary }]}>Tối</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Chọn Màu sắc */}
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceInfo}>
              <Ionicons name="color-palette-outline" size={20} color={colors.text} />
              <Text style={[styles.appearanceLabel, { color: colors.text }]}>Màu chủ đạo</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowColorModal(true)}
              style={[styles.dropdownBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            >
              <View style={[styles.miniCircle, { backgroundColor: themes.find(t => t.type === themeType)?.color }]} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {themes.find(t => t.type === themeType)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút Đăng xuất / Đăng nhập */}
        {user ? (
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: colors.card, borderColor: '#fecaca' }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.dangerT}>Đăng Xuất</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: colors.card, borderColor: colors.primary + '40' }]} onPress={goToLogin}>
            <Ionicons name="log-in-outline" size={18} color={colors.primary} />
            <Text style={[styles.dangerT, { color: colors.primary }]}>Đăng Nhập</Text>
          </TouchableOpacity>
        )}

        {/* Nút Xóa dữ liệu (Yêu cầu nhấn giữ 2 giây) */}
        <TouchableOpacity 
          style={[styles.dangerBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onLongPress={onClear}
          delayLongPress={1000}
        >
          <Ionicons name="trash-outline" size={18} color="#f97316" />
          <Text style={[styles.dangerT, { color: '#f97316' }]}>Nhấn giữ 1s để Xóa dữ liệu & Đặt lại</Text>
        </TouchableOpacity>

        {/* Thông tin phiên bản */}
        <Text style={[styles.ver, { color: colors.textSecondary }]}>Phiên bản {APP_VERSION} (Expo)</Text>
      </ScrollView>

      {/* Modal Cài đặt Đích đăng mặc định */}
      <Modal visible={showDestModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.mHead}>
              <Text style={[styles.mTitle, { color: colors.text }]}>Đích đăng mặc định</Text>
              <TouchableOpacity onPress={() => setShowDestModal(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => toggleDest('personal')}
                style={[
                  styles.destItem,
                  { backgroundColor: colors.inputBackground },
                  defDests.includes('personal') && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
                ]}
              >
                <Ionicons name="person" size={20} color={defDests.includes('personal') ? colors.primary : colors.textSecondary} />
                <Text style={[styles.destText, { color: defDests.includes('personal') ? colors.primary : colors.textSecondary }]}>Nhật ký cá nhân</Text>
                {defDests.includes('personal') && <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>

              {userGroups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => toggleDest(g.id)}
                  style={[
                    styles.destItem,
                    { backgroundColor: colors.inputBackground, marginTop: 8 },
                    defDests.includes(g.id) && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
                  ]}
                >
                  <Ionicons name="people" size={20} color={defDests.includes(g.id) ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.destText, { color: defDests.includes(g.id) ? colors.primary : colors.textSecondary }]}>{g.localName || g.name}</Text>
                  {defDests.includes(g.id) && <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={saveDests} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Lưu thiết lập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Đổi tên */}
      <Modal visible={showNameModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.mTitle, { color: colors.text }]}>Đổi tên hiển thị</Text>
            <TextInput 
              value={newName} 
              onChangeText={setNewName} 
              placeholder="Nhập tên mới" 
              style={[styles.input, { color: colors.text, borderColor: colors.border, marginBottom: 20, height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15 }]} 
              placeholderTextColor={colors.textSecondary} 
            />
            <View style={styles.mBtns}>
              <TouchableOpacity onPress={() => setShowNameModal(false)} style={styles.mBtn}><Text style={{ color: colors.textSecondary }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdateName} 
                disabled={nameLoading} 
                style={[styles.mBtn, { backgroundColor: colors.primary, borderRadius: 8, minWidth: 80, alignItems: 'center' }]}
              >
                {nameLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chọn Màu sắc (Dropdown) */}
      <Modal visible={showColorModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.mHead}>
              <Text style={[styles.mTitle, { color: colors.text }]}>Chọn màu chủ đạo</Text>
              <TouchableOpacity onPress={() => setShowColorModal(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            
            <View style={{ gap: 8, marginBottom: 16 }}>
              {themes.map((t) => (
                <TouchableOpacity
                  key={t.type}
                  onPress={() => { setThemeType(t.type); setShowColorModal(false); }}
                  style={[
                    styles.colorOption,
                    { backgroundColor: colors.inputBackground },
                    themeType === t.type && { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1 }
                  ]}
                >
                  <View style={[styles.colorCircleSmall, { backgroundColor: t.color }]} />
                  <Text style={[styles.colorLabel, { color: themeType === t.type ? colors.primary : colors.text }]}>{t.label}</Text>
                  {themeType === t.type && <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  body: { flex: 1, padding: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  pInfo: { marginLeft: 16 },
  pName: { fontSize: 18, fontWeight: 'bold' },
  pEmail: { fontSize: 14, marginTop: 2 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  dangerBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  dangerT: { color: '#ef4444', fontSize: 14, fontWeight: '500', marginLeft: 8 },
  ver: { textAlign: 'center', fontSize: 10, marginBottom: 100 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  check: { marginLeft: 'auto' },
  appearanceCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
  appearanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  appearanceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appearanceLabel: { fontSize: 15, fontWeight: '500' },
  segmentContainer: { flexDirection: 'row', borderRadius: 8, padding: 2, width: 120 },
  segmentBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 8, minWidth: 120 },
  miniCircle: { width: 12, height: 12, borderRadius: 6 },
  dropdownText: { fontSize: 14, fontWeight: '500', flex: 1 },
  colorOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  colorCircleSmall: { width: 24, height: 24, borderRadius: 12 },
  colorLabel: { fontSize: 16, fontWeight: '500' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { width: '100%', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  mHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mTitle: { fontSize: 18, fontWeight: 'bold' },
  destItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  destText: { fontSize: 16, fontWeight: '500' },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
  mBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
});

export default SettingsScreen;
