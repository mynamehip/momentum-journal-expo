# Momentum Journal - Expo React Native

Ứng dụng nhật ký cá nhân được xây dựng bằng React Native và Expo.

## Tính năng

- 📝 Tạo và quản lý các bài viết nhật ký
- 📊 Thống kê và biểu đồ
- 💬 Tính năng social (mock)
- 🌙 Hỗ trợ Dark Mode
- 📸 Hỗ trợ đính kèm ảnh

## Cài đặt

```bash
cd momentum-journal-expo
npm install
```

## Chạy ứng dụng

```bash
# Chạy với Expo Go
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy trên Web
npm run web
```

## Cấu trúc thư mục

```
momentum-journal-expo/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # UI components
│   │   └── JournalCard/
│   ├── context/            # React Context
│   ├── navigation/         # Navigation setup
│   ├── screens/            # Screen components
│   │   ├── Home/
│   │   ├── Stats/
│   │   ├── Social/
│   │   ├── Settings/
│   │   └── Create/
│   ├── services/           # Business logic
│   │   └── dataService.ts
│   ├── types/              # TypeScript types
│   └── constants/          # App constants
```

## Tech Stack

- React Native 0.81
- Expo SDK 54
- TypeScript
- React Navigation 7
- AsyncStorage
- Expo Image Picker
