import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Interface cho tin nhắn đơn lẻ
interface Msg {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

// Interface cho cuộc hội thoại (Khớp với Social Screen)
interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  lastTime: string;
  msgs: Msg[];
}

interface ChatViewProps {
  conversation: Chat;
  onBack: () => void;
  colors: any;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack, colors }) => {
  const [txt, setTxt] = useState(''); // Nội dung tin nhắn đang nhập
  const [list, setList] = useState(conversation.msgs); // Danh sách tin nhắn hiển thị
  const listRef = useRef<FlatList>(null);

  // Xử lý gửi tin nhắn mới
  const onSend = () => {
    if (!txt.trim()) return;
    
    const newMsg: Msg = { 
      id: Date.now().toString(), 
      senderId: 'me', 
      text: txt, 
      timestamp: Date.now() 
    };
    
    setList(prev => [...prev, newMsg]);
    setTxt('');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.main, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      keyboardVerticalOffset={90}
    >
      {/* Header: Chứa nút quay lại, avatar và tên người nhận */}
      <View style={[styles.head, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.hLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarT, { color: colors.primary }]}>{conversation.avatar}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{conversation.name}</Text>
        </View>
        
        {/* Các nút chức năng phụ (Gọi điện, Video) */}
        <View style={styles.hRight}>
          <TouchableOpacity style={styles.btn}><Ionicons name="call" size={20} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity style={styles.btn}><Ionicons name="videocam" size={20} color={colors.primary} /></TouchableOpacity>
        </View>
      </View>

      {/* Danh sách tin nhắn */}
      <FlatList
        ref={listRef} 
        data={list} 
        keyExtractor={it => it.id}
        style={styles.list} 
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd()} // Tự động cuộn xuống cuối khi có tin nhắn mới
        renderItem={({ item }) => {
          const isMe = item.senderId === 'me';
          return (
            <View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
              <View style={[
                styles.bubble, 
                isMe ? [styles.bubbleMe, { backgroundColor: colors.primary }] : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border }]
              ]}>
                <Text style={[styles.msgText, { color: isMe ? '#fff' : colors.text }]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Ô nhập tin nhắn */}
      <View style={[styles.inWrap, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={[styles.inBox, { backgroundColor: colors.inputBackground }]}>
          <TextInput 
            value={txt} 
            onChangeText={setTxt} 
            placeholder="Nhập tin nhắn..." 
            placeholderTextColor={colors.textSecondary} 
            style={[styles.input, { color: colors.text }]} 
            onSubmitEditing={onSend} 
          />
          <TouchableOpacity 
            onPress={onSend} 
            style={[styles.sendBtn, { backgroundColor: txt.trim() ? colors.primary : 'transparent' }]}
          >
            <Ionicons name="send" size={16} color={txt.trim() ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1 },
  hLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 8, padding: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarT: { fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold' },
  hRight: { flexDirection: 'row', gap: 8 },
  btn: { padding: 8 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  msgWrap: { marginBottom: 8, alignItems: 'flex-start' },
  msgWrapMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4, borderWidth: 1 },
  msgText: { fontSize: 14 },
  inWrap: { padding: 12, borderTopWidth: 1 },
  inBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8 },
  input: { flex: 1, fontSize: 14 },
  sendBtn: { padding: 6, borderRadius: 12, marginLeft: 8 },
});

export default ChatView;
