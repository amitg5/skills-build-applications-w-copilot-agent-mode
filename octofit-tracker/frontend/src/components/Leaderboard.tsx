import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (isMounted) {
          setLeaderboard(data.leaderboard ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Unable to load leaderboard. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      items={leaderboard}
      emptyMessage="No leaderboard entries yet."
      renderItem={(entry) => (
        <div className="d-flex justify-content-between align-items-center gap-3">
          <span>#{entry.rank} {entry.teamName}</span>
          <strong>{entry.totalPoints}</strong>
        </div>
      )}
    />
  );
}
