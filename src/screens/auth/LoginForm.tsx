import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config';
import { useTheme } from '../../theme';
import { useAuth } from '../../context';
import { syncLocalEntriesToCloud } from '../../services/dataService';

const LoginForm: React.FC = () => {
  const { colors } = useTheme();
  const { continueAsGuest } = useAuth();
  const navigation = useNavigation<any>();

  // --- State quản lý form ---
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState(''); // Rút ngắn password -> pass
  const [loading, setLoading] = useState(false);

  // Xử lý đăng nhập
  const onLogin = async () => {
    if (!email || !pass) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      // Đăng nhập với Firebase
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      // Hỏi người dùng có muốn đồng bộ dữ liệu local lên cloud không
      Alert.alert(
        'Đồng bộ dữ liệu?',
        'Bạn có muốn tải các khoảnh khắc đã lưu cục bộ lên đám mây không?',
        [
          { text: 'Để sau', style: 'cancel' },
          { 
            text: 'Đồng bộ ngay', 
            onPress: async () => {
              setLoading(true);
              try {
                const res = await syncLocalEntriesToCloud(uid);
                Alert.alert('Thành công', `Đã đồng bộ ${res.synced} mục, bỏ qua ${res.skipped} mục.`);
              } catch (err: any) {
                Alert.alert('Lỗi đồng bộ', err?.message || 'Vui lòng thử lại sau.');
              } finally {
                setLoading(false);
              }
            }
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Chào mừng trở lại</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Đăng nhập để tiếp tục hành trình của bạn</Text>
        
        {/* Input Email */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Email" 
          placeholderTextColor={colors.textSecondary} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
        
        {/* Input Mật khẩu */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Mật khẩu" 
          placeholderTextColor={colors.textSecondary} 
          value={pass} 
          onChangeText={setPass} 
          secureTextEntry 
        />

        {/* Nút Đăng nhập */}
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary }]} 
          onPress={onLogin} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng Nhập</Text>}
        </TouchableOpacity>

        {/* Các liên kết chuyển hướng */}
        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.linkSmall, { color: colors.textSecondary }]}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.link, { color: colors.primary }]}>Chưa có tài khoản? Đăng ký ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkWrap} onPress={continueAsGuest}>
          <Text style={[styles.link, { color: colors.textSecondary }]}>Tiếp tục mà không cần tài khoản</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  btn: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkWrap: { marginTop: 15, alignItems: 'center' },
  linkSmall: { fontSize: 14 },
  link: { fontSize: 16 },
});

export default LoginForm;
