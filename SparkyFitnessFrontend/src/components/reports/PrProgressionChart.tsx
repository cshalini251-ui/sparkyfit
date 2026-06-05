import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePreferences } from "@/contexts/PreferencesContext";
import ZoomableChart from '../ZoomableChart';

interface PrProgressionChartProps {
  prProgressionData: {
    date: string;
    oneRM: number;
    maxWeight: number;
    maxReps: number;
  }[] | null;
}

const PrProgressionChart: React.FC<PrProgressionChartProps> = ({ prProgressionData }) => {
  const { formatDateInUserTimezone } = usePreferences();

  if (!prProgressionData || prProgressionData.length === 0) {
    return null;
  }

  const formattedData = prProgressionData.map(d => ({
    ...d,
    date: formatDateInUserTimezone(d.date, 'MMM dd, yyyy'),
  }));

  return (
    <ZoomableChart title="Personal Record Progression">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Reps', angle: -90, position: 'insideRight' }} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="oneRM" stroke="#8884d8" name="Estimated 1RM" />
          <Line yAxisId="left" type="monotone" dataKey="maxWeight" stroke="#82ca9d" name="Max Weight" />
          <Line yAxisId="right" type="monotone" dataKey="maxReps" stroke="#ffc658" name="Max Reps" />
        </LineChart>
      </ResponsiveContainer>
    </ZoomableChart>
  );
};

export default PrProgressionChart;