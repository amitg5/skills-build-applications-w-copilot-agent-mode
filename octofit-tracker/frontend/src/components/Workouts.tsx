import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkoutSuggestions() {
      try {
        const userEmail = encodeURIComponent('mona@example.com');
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`);
        if (isMounted) {
          setSuggestions(data.suggestions ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Unable to load workout suggestions. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadWorkoutSuggestions();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      items={suggestions}
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => (
        <div>
          <div className="d-flex justify-content-between align-items-center gap-3">
            <strong>{suggestion.title}</strong>
            <small>{suggestion.focus}</small>
          </div>
          <div>{suggestion.reason ?? 'Builds your next session.'}</div>
        </div>
      )}
    />
  );
}
