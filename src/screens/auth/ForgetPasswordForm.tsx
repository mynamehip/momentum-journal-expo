import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config';
import { useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const ForgetPasswordForm: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  // --- State quản lý form ---
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý gửi yêu cầu reset mật khẩu
  const onReset = async () => {
    if (!email) { 
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email của bạn'); 
      return; 
    }
    
    setLoading(true);
    try {
      // Gửi email reset mật khẩu từ Firebase
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Đã gửi email', 
        'Vui lòng kiểm tra email của bạn để nhận liên kết đặt lại mật khẩu.', 
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Nút quay lại */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Đặt Lại Mật Khẩu</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Nhập email của bạn để nhận liên kết khôi phục mật khẩu</Text>
        
        {/* Email input */}
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
          placeholder="Email" 
          placeholderTextColor={colors.textSecondary} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />

        {/* Nút gửi */}
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary }]} 
          onPress={onReset} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi Liên Kết</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  form: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 400, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  btn: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default ForgetPasswordForm;
