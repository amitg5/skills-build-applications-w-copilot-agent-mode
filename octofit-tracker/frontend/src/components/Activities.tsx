import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        const data = await getJson<{ activities: Activity[] }>('/api/activities');
        if (isMounted) {
          setActivities(data.activities ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Unable to load activities. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      items={activities}
      emptyMessage="No activities yet."
      renderItem={(activity) => (
        <div className="d-flex justify-content-between align-items-center gap-3">
          <span>{activity.type}</span>
          <small>{activity.minutes} min • {activity.points} pts</small>
        </div>
      )}
    />
  );
}
