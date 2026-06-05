export interface MealFood {
  id?: string;
  meal_id?: string;
  food_id: string;
  variant_id?: string;
  quantity: number;
  unit: string;
  food_name?: string; // For display purposes in frontend
  brand?: string; // For display purposes in frontend
  // Add other nutritional properties if needed for client-side calculations/display
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  saturated_fat?: number;
  polyunsaturated_fat?: number;
  monounsaturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  potassium?: number;
  dietary_fiber?: number;
  sugars?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
}

export interface Meal {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  foods?: MealFood[]; // Array of foods included in the meal template
  selectedDate?: string; // Add selectedDate to Meal interface
}

export interface MealPlanEntry {
  id?: string;
  user_id?: string;
  meal_id?: string;
  food_id?: string;
  variant_id?: string;
  quantity?: number;
  unit?: string;
  plan_date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  is_template?: boolean;
  template_name?: string;
  day_of_week?: number; // 0 for Sunday, 1 for Monday, etc.
  created_at?: string;
  updated_at?: string;
  // Populated fields from joins for frontend display
  meal_name?: string;
  meal_description?: string;
  food_name?: string;
  food_brand?: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  saturated_fat?: number;
  polyunsaturated_fat?: number;
  monounsaturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  potassium?: number;
  dietary_fiber?: number;
  sugars?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
}