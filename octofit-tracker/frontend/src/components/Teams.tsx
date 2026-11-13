import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

interface Team {
  name: string;
  members: string[];
  [key: string]: unknown;
}

interface TeamsResponse {
  teams: Team[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<TeamsResponse>('/api/teams')
      .then((data) => {
        setTeams(data.teams);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Teams">
        <p role="status">Loading teams...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Teams">
        <p role="alert">Unable to load teams: {error}</p>
      </CapabilityCard>
    );
  }

  if (teams.length === 0) {
    return (
      <CapabilityCard title="Teams">
        <p>No teams created yet.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Teams">
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={index}>
                <td>{team.name}</td>
                <td>{team.members?.join(', ') || 'No members'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CapabilityCard>
  );
}
