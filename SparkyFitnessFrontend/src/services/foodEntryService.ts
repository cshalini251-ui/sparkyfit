import { apiCall } from "./api";

interface FoodEntryUpdateData {
  quantity?: number;
  unit?: string;
}

export const updateFoodEntry = async (id: string, data: FoodEntryUpdateData): Promise<any> => {
  const response = await apiCall(`/food-entries/${id}`, {
    method: 'PUT',
    body: data,
  });
  return response;
};

export interface FoodEntryCreateData {
  user_id: string;
  food_id: string;
  meal_type: string;
  quantity: number;
  unit: string;
  entry_date: string;
  variant_id?: string | null;
}

export const createFoodEntry = async (data: FoodEntryCreateData): Promise<any> => {
  const response = await apiCall('/food-entries', {
    method: 'POST',
    body: data,
  });
  return response;
};