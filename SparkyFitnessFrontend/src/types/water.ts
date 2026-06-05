export interface WaterContainer {
  id: number;
  user_id: string;
  name: string;
  volume: number;
  unit: 'ml' | 'oz' | 'cup' | 'liter'; // Added 'liter'
  is_primary: boolean;
}