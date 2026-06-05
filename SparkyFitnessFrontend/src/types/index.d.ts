export interface MoodEntry {
  id: string;
  user_id: string;
  mood_value: number;
  notes: string | null;
  entry_date: string; // ISO date string (YYYY-MM-DD)
  created_at: string; // ISO timestamp string
  updated_at: string; // ISO timestamp string
}

export * from './workout';