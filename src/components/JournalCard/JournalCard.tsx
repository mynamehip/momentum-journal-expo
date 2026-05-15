import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { JournalEntry, MomentType } from '../../types';
import { useTheme } from '../../theme';
import { optimizeCloudinaryUrl } from '../../utils';

interface JournalCardProps {
  entry: JournalEntry;
  onPress?: () => void;
  onLongPress?: () => void;
}

const JournalCard = React.forwardRef<any, JournalCardProps>(({ entry, onPress, onLongPress }, ref) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const date = new Date(entry.createdAt);
  const handlePress = onPress || (() => navigation.navigate('EntryDetail', { entry }));

  return (
    <TouchableOpacity
      ref={ref}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={1000} // Cài đặt thời gian nhấn giữ là đúng 1 giây
      activeOpacity={0.9}
      style={[styles.polaroid, { shadowColor: '#000' }]}
    >
      {/* Top Border: User Name (if group) & Time */}
      <View style={styles.polaroidTop}>
        {entry.groupId && entry.userName ? (
          <Text style={styles.polaroidUser} numberOfLines={1}>
            {entry.userName}
          </Text>
        ) : <View />}
        
        <Text style={styles.polaroidTime}>
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Middle Image Area */}
      {entry.mediaUrl && (entry.type === MomentType.PHOTO || entry.type === MomentType.VIDEO) && (
        <View style={styles.polaroidImageWrapper}>
          <Image
            source={{ 
              uri: Platform.OS === 'web' 
                ? optimizeCloudinaryUrl(entry.mediaUrl, 500) 
                : (entry.localUri || optimizeCloudinaryUrl(entry.mediaUrl, 500)) 
            }}
            style={styles.polaroidImage}
            resizeMode="cover"
          />
          {entry.type === MomentType.VIDEO && (
            <View style={styles.playOverlay}>
              <View style={styles.playIconCircle}>
                <Ionicons name="play" size={32} color="white" style={{ marginLeft: 4 }} />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom Border: Content */}
      <View style={styles.polaroidBottom}>
        <Text style={styles.polaroidContent} numberOfLines={2}>
          {entry.content || ' '}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  polaroid: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingTop: 2,
    paddingBottom: 15, // Thicker bottom border
    borderRadius: 2,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  polaroidTop: {
    paddingBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polaroidUser: {
    fontSize: 9,
    fontWeight: '600',
    color: '#505050ff',
    fontFamily: 'Mansalva',
    maxWidth: '60%',
  },
  polaroidTime: {
    fontSize: 9,
    fontWeight: '400',
    color: '#505050ff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Mansalva',
  },
  polaroidImageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4, // 3:4 aspect ratio
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  polaroidVideoWrapper: {
    width: '100%',
    height: 250,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  polaroidBottom: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  polaroidContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#505050ff',
    textAlign: 'center',
    fontFamily: 'Mansalva',
    opacity: 0.85,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default JournalCard;
