import { apiCall } from './api';

export interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const loadNutritionTrendData = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DayData[]> => {
  const params = new URLSearchParams({
    userId,
    startDate,
    endDate,
  });
  return apiCall(`/reports/nutrition-trends-with-goals?${params.toString()}`, {
    method: 'GET',
  });
};