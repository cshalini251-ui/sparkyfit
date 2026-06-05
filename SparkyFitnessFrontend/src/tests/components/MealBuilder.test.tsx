import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealBuilder from '../../components/MealBuilder';
import { useActiveUser } from '../../contexts/ActiveUserContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { toast } from '../../hooks/use-toast';
import { createMeal, updateMeal, getMealById } from '../../services/mealService';
import { searchFoods, getFoodVariantsByFoodId } from '../../services/foodService';

// Mock external modules
jest.mock('../../contexts/ActiveUserContext', () => ({
  useActiveUser: () => ({ activeUserId: 'testUserId' }),
}));
jest.mock('../../contexts/PreferencesContext', () => ({
  usePreferences: () => ({ loggingLevel: 'debug' }),
}));
jest.mock('../../hooks/use-toast', () => ({
  toast: jest.fn(),
}));
jest.mock('../../services/mealService', () => ({
  createMeal: jest.fn(),
  updateMeal: jest.fn(),
  getMealById: jest.fn(),
}));
jest.mock('../../services/foodService', () => ({
  searchFoods: jest.fn(),
  getFoodVariantsByFoodId: jest.fn(),
}));

describe('MealBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in create mode', () => {
    render(<MealBuilder />);
    expect(screen.getByText('Create New Meal')).toBeInTheDocument();
    expect(screen.getByLabelText('Meal Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Share with Public')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for food...')).toBeInTheDocument();
    expect(screen.getByText('Save Meal')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders correctly in edit mode and loads meal data', async () => {
    const mockMeal = {
      id: 'meal1',
      name: 'Existing Meal',
      description: 'Existing Description',
      is_public: true,
      foods: [{ food_id: 'food1', food_name: 'Apple', quantity: 1, unit: 'piece' }],
    };
    (getMealById as jest.Mock).mockResolvedValue(mockMeal);

    render(<MealBuilder mealId="meal1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Meal')).toBeInTheDocument();
      expect(screen.getByLabelText('Meal Name')).toHaveValue('Existing Meal');
      expect(screen.getByLabelText('Description (Optional)')).toHaveValue('Existing Description');
      expect(screen.getByLabelText('Share with Public')).toBeChecked();
      expect(screen.getByText('Apple - 1 piece')).toBeInTheDocument();
    });
  });

  it('allows adding a food to the meal', async () => {
    const mockFood = {
      id: 'food1',
      name: 'Banana',
      default_variant: { id: 'variant1', serving_unit: 'piece', serving_size: 1, calories: 100, protein: 1, carbs: 1, fat: 1 },
    };
    (searchFoods as jest.Mock).mockResolvedValue([mockFood]);
    (getFoodVariantsByFoodId as jest.Mock).mockResolvedValue([mockFood.default_variant]);

    render(<MealBuilder />);

    fireEvent.change(screen.getByPlaceholderText('Search for food...'), { target: { value: 'banana' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Add Banana')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'ea' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm add/i }));

    await waitFor(() => {
      expect(screen.getByText('Banana - 2 ea')).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Banana added to meal.',
      });
    });
  });

  it('allows removing a food from the meal', async () => {
    const mockMeal = {
      id: 'meal1',
      name: 'Existing Meal',
      foods: [{ food_id: 'food1', food_name: 'Apple', quantity: 1, unit: 'piece' }],
    };
    (getMealById as jest.Mock).mockResolvedValue(mockMeal);

    render(<MealBuilder mealId="meal1" />);

    await waitFor(() => {
      expect(screen.getByText('Apple - 1 piece')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.queryByText('Apple - 1 piece')).not.toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith({
        title: 'Removed',
        description: 'Food removed from meal.',
      });
    });
  });

  it('saves a new meal successfully', async () => {
    (createMeal as jest.Mock).mockResolvedValue({ id: 'newMealId', name: 'New Meal', foods: [] });
    const onSaveMock = jest.fn();

    render(<MealBuilder onSave={onSaveMock} />);

    fireEvent.change(screen.getByLabelText('Meal Name'), { target: { value: 'My New Meal' } });

    // Add a dummy food to satisfy validation
    const mockFood = {
      id: 'food1',
      name: 'Dummy Food',
      default_variant: { id: 'variant1', serving_unit: 'g', serving_size: 1, calories: 1, protein: 1, carbs: 1, fat: 1 },
    };
    (searchFoods as jest.Mock).mockResolvedValue([mockFood]);
    (getFoodVariantsByFoodId as jest.Mock).mockResolvedValue([mockFood.default_variant]);

    fireEvent.change(screen.getByPlaceholderText('Search for food...'), { target: { value: 'dummy' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => expect(screen.getByText('Dummy Food')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() => expect(screen.getByText('Add Dummy Food')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'g' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm add/i }));
    await waitFor(() => expect(screen.getByText('Dummy Food - 10 g')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Save Meal'));

    await waitFor(() => {
      expect(createMeal).toHaveBeenCalledWith('testUserId', expect.objectContaining({ name: 'My New Meal' }));
      expect(onSaveMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'newMealId' }));
      expect(toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Meal created successfully!',
      });
    });
  });

  it('updates an existing meal successfully', async () => {
    const mockMeal = {
      id: 'meal1',
      name: 'Original Meal',
      description: 'Original Description',
      is_public: false,
      foods: [],
    };
    (getMealById as jest.Mock).mockResolvedValue(mockMeal);
    (updateMeal as jest.Mock).mockResolvedValue({ ...mockMeal, name: 'Updated Name' });
    const onSaveMock = jest.fn();

    render(<MealBuilder mealId="meal1" onSave={onSaveMock} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Meal Name')).toHaveValue('Original Meal');
    });

    fireEvent.change(screen.getByLabelText('Meal Name'), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByText('Save Meal'));

    await waitFor(() => {
      expect(updateMeal).toHaveBeenCalledWith('testUserId', 'meal1', expect.objectContaining({ name: 'Updated Name' }));
      expect(onSaveMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
      expect(toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Meal updated successfully!',
      });
    });
  });

  it('shows error if meal name is empty on save', async () => {
    render(<MealBuilder />);
    fireEvent.click(screen.getByText('Save Meal'));
    expect(toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Meal name cannot be empty.',
      variant: 'destructive',
    });
  });

  it('shows error if no foods are added to meal on save', async () => {
    render(<MealBuilder />);
    fireEvent.change(screen.getByLabelText('Meal Name'), { target: { value: 'Meal with no foods' } });
    fireEvent.click(screen.getByText('Save Meal'));
    expect(toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'A meal must contain at least one food item.',
      variant: 'destructive',
    });
  });
});