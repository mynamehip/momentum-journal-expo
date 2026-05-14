import { MOOD_COLORS } from '../theme/colors';
import { VIETNAMESE_MOODS } from '../constants/mood';

const clampMoodIndex = (score: number): number =>
  Math.max(1, Math.min(9, Math.round(score)));

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const getMoodEmoji = (score: number): string => {
  const rounded = Math.round(score);
  const mood = VIETNAMESE_MOODS.find(m => m.score === rounded);
  return mood ? mood.icon : '😶'; // '😶' là icon của neutral
};

export const calculateSentimentScore = (text: string): number => {
  if (!text) return 5; // Mặc định là bình thường (neutral)
  const lowText = text.toLowerCase();
  
  // Duyệt qua danh sách moods để tìm từ khóa phù hợp nhất
  // Vì danh sách moods được xếp theo thứ tự ưu tiên (cụ thể hơn lên trước), 
  // chúng ta có thể lấy kết quả đầu tiên tìm thấy.
  for (const mood of VIETNAMESE_MOODS) {
    if (mood.keywords.some(kw => lowText.includes(kw.toLowerCase()))) {
      return mood.score;
    }
  }
  
  return 5; // Mặc định nếu không tìm thấy từ khóa nào
};

export const getMoodColor = (score: number): string =>
  MOOD_COLORS[clampMoodIndex(score)] || '#66BB6A';

export const formatDate = (timestamp: number): {
  dateKey: string;
  displayDate: string;
  dayOfWeek: string;
} => {
  const date = new Date(timestamp);
  const dateKey = date.toISOString().split('T')[0];
  const displayDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const dayOfWeek = DAY_NAMES[date.getDay()];
  return { dateKey, displayDate, dayOfWeek };
};

export const isToday = (dateKey: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateKey === today;
};

export const getPrivacyLabel = (privacy: string): string => {
  switch (privacy) {
    case 'PUBLIC':
      return 'Public';
    case 'GROUP':
      return 'Group';
    default:
      return 'Private';
  }
};
