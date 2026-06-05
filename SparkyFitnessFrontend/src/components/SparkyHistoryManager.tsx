
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { apiCall } from "@/services/api";

interface SparkyHistoryManagerProps {
  onClose: () => void;
}

const SparkyHistoryManager = ({ onClose }: SparkyHistoryManagerProps) => {
  const { user } = useAuth();
  const [clearPreference, setClearPreference] = useState<string>('never');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    let data = null;
    let error = null;
    try {
      data = await apiCall(`/user-preferences/${user.id}`, { method: 'GET' });
    } catch (err: any) {
      error = err;
    }

    if (error) {
      console.error('Error loading user preferences:', error);
    } else {
      setClearPreference(data.auto_clear_history || 'never');
    }
  };

  const handleUpdatePreferences = async () => {
    if (!user) return;

    setLoading(true);
    let error = null;
    try {
      await apiCall('/user-preferences', 'POST', {
        user_id: user.id,
        auto_clear_history: clearPreference
      });
    } catch (err: any) {
      error = err;
    }

    if (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update chat preferences');
    } else {
      toast.success('Chat preferences updated successfully');
      onClose();
    }
    setLoading(false);
  };

  const clearAllHistory = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;

    setLoading(true);
    let error = null;
    try {
      await apiCall(`/sparky-chat-history/${user.id}`, { method: 'DELETE' });
    } catch (err: any) {
      error = err;
    }

    if (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear chat history');
    } else {
      toast.success('All chat history cleared');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="auto_clear_history">Auto Clear Chat History</Label>
        <Select
          value={clearPreference}
          onValueChange={setClearPreference}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never clear</SelectItem>
            <SelectItem value="7days">Clear after 7 days</SelectItem>
            <SelectItem value="all">Clear all history</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Controls how chat history is preserved for AI context
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleUpdatePreferences} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
        <Button variant="destructive" onClick={clearAllHistory} disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All History
        </Button>
      </div>
    </div>
  );
};

export default SparkyHistoryManager;
