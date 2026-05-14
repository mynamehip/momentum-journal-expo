import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  colors: any;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }]}>
      <Ionicons name="search" size={16} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search moments..."
        placeholderTextColor={colors.textSecondary + '80'}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
});

export default SearchBar;
