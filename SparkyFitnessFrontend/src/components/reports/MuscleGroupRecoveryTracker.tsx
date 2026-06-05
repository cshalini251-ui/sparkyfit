import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

interface MuscleGroupRecoveryTrackerProps {
  recoveryData: {
    [muscleGroup: string]: string; // Maps muscle group to the last workout date
  } | null;
}

const MuscleGroupRecoveryTracker: React.FC<MuscleGroupRecoveryTrackerProps> = ({ recoveryData }) => {
  if (!recoveryData || Object.keys(recoveryData).length === 0) {
    return null;
  }

  // Sort muscle groups by the most recently worked
  const sortedMuscleGroups = Object.entries(recoveryData).sort(([, dateA], [, dateB]) => {
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscle Group Recovery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMuscleGroups.map(([muscle, lastWorkoutDate]) => (
            <div key={muscle} className="flex items-center justify-between">
              <span className="font-medium capitalize">{muscle}</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(lastWorkoutDate), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MuscleGroupRecoveryTracker;