import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import MealManagement from '../../components/MealManagement';

describe('MealManagement', () => {
  it('renders the MealManagement component', () => {
    render(
      <Router>
        <MealManagement />
      </Router>
    );
    expect(screen.getByText('Meal Management')).toBeInTheDocument();
  });
});