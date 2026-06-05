import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseSearch from "./ExerciseSearch";
import WorkoutPresetSelector from "./WorkoutPresetSelector"; // Import WorkoutPresetSelector
import ExerciseImportCSV, { ExerciseCSVData } from "./ExerciseImportCSV"; // Renamed import and import ExerciseCSVData
import { createExercise, Exercise } from "@/services/exerciseService";
import { WorkoutPreset } from "@/types/workout"; // Import WorkoutPreset type
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, XCircle } from "lucide-react";
import { apiCall } from "@/services/api"; // Import apiCall

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseAdded: (exercise: Exercise, sourceMode: 'internal' | 'external' | 'custom' | 'preset') => void;
  onWorkoutPresetSelected?: (preset: WorkoutPreset) => void; // New prop for selecting a workout preset
  mode: 'preset' | 'workout-plan' | 'diary' | 'database-manager';
}

const AddExerciseDialog = ({ open, onOpenChange, onExerciseAdded, mode, onWorkoutPresetSelected }: AddExerciseDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'database-manager' ? 'online' : 'my-exercises');
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("general");
  const [newExerciseCalories, setNewExerciseCalories] = useState(300); // Default calculated calories
  const [manualCaloriesPerHour, setManualCaloriesPerHour] = useState<number | undefined>(undefined); // For manual override
  const [newExerciseDescription, setNewExerciseDescription] = useState("");
  const [newExerciseSource, setNewExerciseSource] = useState("custom"); // Default to "custom"
  const [newExerciseForce, setNewExerciseForce] = useState("");
  const [newExerciseLevel, setNewExerciseLevel] = useState("");
  const [newExerciseMechanic, setNewExerciseMechanic] = useState("");
  const [newExerciseEquipment, setNewExerciseEquipment] = useState("");
  const [newExercisePrimaryMuscles, setNewExercisePrimaryMuscles] = useState("");
  const [newExerciseSecondaryMuscles, setNewExerciseSecondaryMuscles] = useState("");
  const [newExerciseInstructions, setNewExerciseInstructions] = useState("");
  const [newExerciseImages, setNewExerciseImages] = useState<File[]>([]); // State to hold image files
  const [newExerciseImageUrls, setNewExerciseImageUrls] = useState<string[]>([]); // State to hold image URLs for display
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null); // For reordering

  const handleExerciseSelect = (exercise: Exercise, sourceMode: 'internal' | 'external') => {
    toast({
      title: "Success",
      description: `${exercise.name} added to your exercises.`,
    });
    onExerciseAdded(exercise, sourceMode); // Pass the selected exercise and source mode
    onOpenChange(false);
  };

  const handleAddCustomExercise = async () => {
    if (!user) return;
    try {
      const newExercise = {
        name: newExerciseName,
        category: newExerciseCategory,
        calories_per_hour: manualCaloriesPerHour !== undefined ? manualCaloriesPerHour : newExerciseCalories, // Use manual if provided
        description: newExerciseDescription,
        user_id: user.id,
        is_custom: true,
        source: newExerciseSource,
        force: newExerciseForce,
        level: newExerciseLevel,
        mechanic: newExerciseMechanic,
        equipment: newExerciseEquipment.split(',').map(s => s.trim()).filter(s => s),
        primary_muscles: newExercisePrimaryMuscles.split(',').map(s => s.trim()).filter(s => s),
        secondary_muscles: newExerciseSecondaryMuscles.split(',').map(s => s.trim()).filter(s => s),
        instructions: newExerciseInstructions.split('\n').map(s => s.trim()).filter(s => s),
        // images: newExerciseImageUrls, // Do not send URLs to backend, server will handle based on uploaded files
      };

      const formData = new FormData();
      formData.append('exerciseData', JSON.stringify(newExercise));
      newExerciseImages.forEach((file) => {
        formData.append('images', file);
      });

      await createExercise(formData);
      toast({
        title: "Success",
        description: "Exercise added successfully",
      });
      // Assuming the newly created exercise is returned by createExercise
      // For now, we'll just pass a placeholder or refetch if necessary.
      // A more robust solution would be to return the created exercise from createExercise.
      onExerciseAdded({ id: 'temp-id', name: newExerciseName, category: newExerciseCategory, calories_per_hour: manualCaloriesPerHour !== undefined ? manualCaloriesPerHour : newExerciseCalories, sets: [{ set_number: 1, set_type: 'Working Set', reps: 10, weight: 0 }] }, 'custom');
      onOpenChange(false);
      setNewExerciseName("");
      setNewExerciseCategory("general");
      setNewExerciseCalories(300);
      setNewExerciseDescription("");
      setNewExerciseSource("custom");
      setNewExerciseForce("");
      setNewExerciseLevel("");
      setNewExerciseMechanic("");
      setNewExerciseEquipment("");
      setNewExercisePrimaryMuscles("");
      setNewExerciseSecondaryMuscles("");
      setNewExerciseInstructions("");
      setNewExerciseImages([]);
      setNewExerciseImageUrls([]);
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewExerciseImages((prevImages) => [...prevImages, ...filesArray]);
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewExerciseImageUrls((prevUrls) => [...prevUrls, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewExerciseImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
    setNewExerciseImageUrls((prevUrls) => prevUrls.filter((_, index) => index !== indexToRemove));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) {
      return;
    }

    const reorderedImages = [...newExerciseImages];
    const reorderedUrls = [...newExerciseImageUrls];

    const [draggedFile] = reorderedImages.splice(draggedImageIndex, 1);
    const [draggedUrl] = reorderedUrls.splice(draggedImageIndex, 1);

    reorderedImages.splice(index, 0, draggedFile);
    reorderedUrls.splice(index, 0, draggedUrl);

    setNewExerciseImages(reorderedImages);
    setNewExerciseImageUrls(reorderedUrls);
    setDraggedImageIndex(null);
  };

  const handleImportFromCSV = async (exerciseDataArray: Omit<ExerciseCSVData, "id">[]) => {
    try {
      const res = await apiCall(`/exercises/import-json`, {
        method: "POST",
        body: JSON.stringify({ exercises: exerciseDataArray }),
      });

      toast({
        title: "Success",
        description: "Exercise data imported successfully",
      });
      onOpenChange(false);
    } catch (error) {
      if (error?.status === 409 && error.data?.duplicates) {
        const duplicateList = error.data.duplicates
          .map(
            (d: { name: string }) => `"${d.name}"`
          )
          .join(", ");

        toast({
          title: "Import Failed: Duplicate Items Found",
          description: `The following items already exist: ${duplicateList}. Please remove them from your file and try again.`,
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "An Error Occurred",
          description:
            error.message || "Failed to import exercise data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={activeTab === 'import-csv' ? "sm:max-w-[95vw] sm:max-h-[95vh] w-[95vw] h-[95vh] overflow-y-auto" : "sm:max-w-[625px] overflow-y-auto max-h-[90vh]"}>
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to your database, either by creating a custom one or importing from an external source.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full grid-cols-${mode === 'database-manager' ? 3 : (mode === 'diary' || mode === 'workout-plan') ? 5 : 4}`}>
            {mode !== 'database-manager' && <TabsTrigger value="my-exercises">My Exercises</TabsTrigger>}
            {(mode === 'diary' || mode === 'workout-plan') && <TabsTrigger value="workout-preset">Workout Preset</TabsTrigger>}
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="custom">Add Custom</TabsTrigger>
            <TabsTrigger value="import-csv">Import CSV</TabsTrigger>
          </TabsList>
          {mode !== 'database-manager' && (
            <TabsContent value="my-exercises">
              <div className="pt-4">
                <ExerciseSearch
                  onExerciseSelect={(exercise, source) => handleExerciseSelect(exercise, source)}
                  disableTabs={true}
                  initialSearchSource="internal"
                />
              </div>
            </TabsContent>
          )}
          <TabsContent value="online">
            <div className="pt-4">
              <ExerciseSearch
                onExerciseSelect={(exercise, source) => handleExerciseSelect(exercise, source)}
                disableTabs={true}
                initialSearchSource="external"
              />
            </div>
          </TabsContent>
          <TabsContent value="custom" className="overflow-y-auto max-h-full">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select onValueChange={setNewExerciseCategory} defaultValue={newExerciseCategory}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="calories" className="text-right">
                  Calories/Hour
                </Label>
                <Input
                  id="calories"
                  type="number"
                  value={manualCaloriesPerHour !== undefined ? manualCaloriesPerHour.toString() : newExerciseCalories.toString()}
                  onChange={(e) => setManualCaloriesPerHour(Number(e.target.value))}
                  placeholder="Calculated: 300" // Show calculated as placeholder
                  className="col-span-3"
                />
                <p className="col-span-4 text-xs text-muted-foreground">
                  Leave blank to use system calculated calories per hour ({newExerciseCalories} cal/hour).
                </p>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newExerciseDescription}
                  onChange={(e) => setNewExerciseDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source" className="text-right">
                  Source
                </Label>
                <Input
                  id="source"
                  value={newExerciseSource}
                  onChange={(e) => setNewExerciseSource(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="force" className="text-right">
                  Force
                </Label>
                <Select onValueChange={setNewExerciseForce} defaultValue={newExerciseForce}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select force" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pull">Pull</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <Select onValueChange={setNewExerciseLevel} defaultValue={newExerciseLevel}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mechanic" className="text-right">
                  Mechanic
                </Label>
                <Select onValueChange={setNewExerciseMechanic} defaultValue={newExerciseMechanic}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select mechanic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isolation">Isolation</SelectItem>
                    <SelectItem value="compound">Compound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="equipment" className="text-right mt-1">
                  Equipment (comma-separated)
                </Label>
                <Textarea
                  id="equipment"
                  value={newExerciseEquipment}
                  onChange={(e) => setNewExerciseEquipment(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="primaryMuscles" className="text-right mt-1">
                  Primary Muscles (comma-separated)
                </Label>
                <Textarea
                  id="primaryMuscles"
                  value={newExercisePrimaryMuscles}
                  onChange={(e) => setNewExercisePrimaryMuscles(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="secondaryMuscles" className="text-right mt-1">
                  Secondary Muscles (comma-separated)
                </Label>
                <Textarea
                  id="secondaryMuscles"
                  value={newExerciseSecondaryMuscles}
                  onChange={(e) => setNewExerciseSecondaryMuscles(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="instructions" className="text-right mt-1">
                  Instructions (one per line)
                </Label>
                <Textarea
                  id="instructions"
                  value={newExerciseInstructions}
                  onChange={(e) => setNewExerciseInstructions(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="images" className="text-right mt-1">
                  Images
                </Label>
                <div className="col-span-3">
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="col-span-3"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newExerciseImageUrls.map((url, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="relative w-24 h-24 cursor-grab"
                      >
                        <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            <Button onClick={handleAddCustomExercise}>Add Exercise</Button>
          </TabsContent>
          <TabsContent value="import-csv">
            <div className="pt-4">
              <ExerciseImportCSV
                onSave={handleImportFromCSV} // Use the new onSave prop
              />
            </div>
          </TabsContent>
          {(mode === 'diary' || mode === 'workout-plan') && (
            <TabsContent value="workout-preset">
              <div className="pt-4">
                <WorkoutPresetSelector
                  onPresetSelected={(preset) => {
                    if (onWorkoutPresetSelected) {
                      onWorkoutPresetSelected(preset);
                    }
                    onOpenChange(false); // Close the dialog after selecting a preset
                  }}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciseDialog;