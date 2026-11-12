import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot: string;
  members: Array<string | { toString(): string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      try {
        const data = await getJson<{ teams: Team[] }>('/api/teams');
        if (isMounted) {
          setTeams(data.teams ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('Unable to load teams. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      items={teams}
      emptyMessage="No teams yet."
      renderItem={(team) => (
        <div className="d-flex justify-content-between align-items-center gap-3">
          <span>{team.name}</span>
          <small>{team.mascot} • {team.members.length} members</small>
        </div>
      )}
    />
  );
}
