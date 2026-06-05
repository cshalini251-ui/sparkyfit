import { toast } from "@/hooks/use-toast";
import { apiCall } from './api';

const PROXY_BASE_URL = "/foods/calorieninjas";

export interface CalorieNinjasFoodItem {
  name: string;
  calories: number;
  serving_size_g: number;
  fat_total_g: number;
  fat_saturated_g: number;
  protein_g: number;
  sodium_mg: number;
  potassium_mg: number;
  cholesterol_mg: number;
  carbohydrates_total_g: number;
  fiber_g: number;
  sugar_g: number;
}

interface CalorieNinjasSearchResponse {
  items: CalorieNinjasFoodItem[];
}

export const searchCalorieNinjasFoods = async (query: string, providerId: string): Promise<CalorieNinjasFoodItem[]> => {
  try {
    const data: CalorieNinjasSearchResponse = await apiCall(`${PROXY_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        'x-provider-id': providerId,
      },
    });
    return data.items || [];
  } catch (error: any) {
    console.error("Network error during CalorieNinjas food search:", error);
    toast({
      title: "Error",
      description: error.message || "Network error during CalorieNinjas search. Please try again.",
      variant: "destructive",
    });
    return [];
  }
};
