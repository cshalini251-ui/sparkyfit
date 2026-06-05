import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveUser } from '@/contexts/ActiveUserContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { getMoodEntries } from '@/services/moodService';
import { MoodEntry } from '@/types/index.d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MoodReports: React.FC = () => {
  const { user } = useAuth();
  const { activeUserId } = useActiveUser();
  const { formatDateInUserTimezone } = usePreferences();

  const currentUserId = activeUserId || user?.id;

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoodData = async () => {
    if (!currentUserId) {
      setError('User not authenticated.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMoodEntries(currentUserId, startDate, endDate);
      setMoodEntries(data);
    } catch (err) {
      console.error('Failed to fetch mood entries:', err);
      setError('Failed to load mood data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodData();
  }, [currentUserId, startDate, endDate]);

  const chartData = moodEntries.map(entry => ({
    date: formatDateInUserTimezone(entry.entry_date, 'MMM dd'),
    mood: entry.mood_value,
  })).reverse(); // Reverse to show chronological order on chart

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mood Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={fetchMoodData} disabled={loading}>
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          {moodEntries.length === 0 && !loading && !error ? (
            <p>No mood data available for the selected period.</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>

              <h3 className="text-lg font-semibold mt-8 mb-4">Detailed Mood Entries</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Mood Value</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moodEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDateInUserTimezone(entry.entry_date, 'PPP')}</TableCell>
                        <TableCell>{entry.mood_value}</TableCell>
                        <TableCell>{entry.notes || '-'}</TableCell>
                        <TableCell>{formatDateInUserTimezone(entry.created_at, 'PPP p')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodReports;