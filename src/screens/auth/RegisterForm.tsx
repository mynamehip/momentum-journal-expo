import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { isUsernameTaken } from '../../services/dataService';
import { useTheme } from '../../theme';

const RegisterForm: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  // --- State quản lý form ---
  const [name, setName] = useState(''); // Thêm state cho tên
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState(''); 
  const [confirm, setConfirm] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Xử lý đăng ký
  const onSignup = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !pass || !confirm) { 
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tất cả các trường'); 
      return; 
    }
    if (name.length < 3) {
      Alert.alert('Lỗi', 'Tên người dùng phải có ít nhất 3 ký tự');
      return;
    }
    if (pass !== confirm) { 
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp'); 
      return; 
    }
    if (pass.length < 6) { 
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự'); 
      return; 
    }

    setLoading(true);
    console.log('--- Bắt đầu đăng ký ---');
    try {
      // 1. Kiểm tra trùng tên
      console.log('1. Đang kiểm tra tên người dùng:', name);
      const taken = await isUsernameTaken(name);
      if (taken) {
        console.warn('Tên người dùng đã tồn tại');
        Alert.alert('Lỗi', 'Tên người dùng này đã được sử dụng. Vui lòng chọn tên khác.');
        setLoading(false);
        return;
      }

      // 2. Tạo tài khoản mới với Firebase
      console.log('2. Đang tạo tài khoản Firebase Auth cho:', email);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('Tạo tài khoản thành công UID:', cred.user.uid);
      
      // 3. Cập nhật profile Firebase Auth
      console.log('3. Đang cập nhật Display Name:', name);
      await updateProfile(cred.user, { displayName: name.trim() });

      // 4. Tạo document người dùng trong Firestore
      console.log('4. Đang tạo dữ liệu người dùng trong Firestore...');
      await setDoc(doc(db, 'users', cred.user.uid), { 
        name: name.trim(),
        email: cred.user.email, 
        createdAt: new Date() 
      });
      console.log('--- Đăng ký hoàn tất thành công ---');
    } catch (err: any) {
      console.error('Lỗi đăng ký:', err.code, err.message);
      Alert.alert('Đăng ký thất bại', err.message);
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
        <Text style={[styles.title, { color: colors.text }]}>Tạo Tài Khoản</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bắt đầu hành trình viết nhật ký của bạn ngay hôm nay</Text>
        
        {/* Tên người dùng */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Tên người dùng (hiển thị)" 
          placeholderTextColor={colors.textSecondary} 
          value={name} 
          onChangeText={setName} 
        />

        {/* Email */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Email" 
          placeholderTextColor={colors.textSecondary} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
        
        {/* Mật khẩu */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Mật khẩu" 
          placeholderTextColor={colors.textSecondary} 
          value={pass} 
          onChangeText={setPass} 
          secureTextEntry 
        />
        
        {/* Xác nhận mật khẩu */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Xác nhận mật khẩu" 
          placeholderTextColor={colors.textSecondary} 
          value={confirm} 
          onChangeText={setConfirm} 
          secureTextEntry 
        />

        {/* Nút Đăng ký */}
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary }]} 
          onPress={onSignup} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng Ký</Text>}
        </TouchableOpacity>

        {/* Chuyển sang Đăng nhập */}
        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: colors.primary }]}>Đã có tài khoản? Đăng nhập</Text>
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
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 16 },
});

export default RegisterForm;
