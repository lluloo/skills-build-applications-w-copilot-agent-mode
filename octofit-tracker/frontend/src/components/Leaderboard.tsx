import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

interface LeaderboardEntry {
  teamName: string;
  totalPoints: number;
  rank: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((data) => {
        setLeaderboard(data.leaderboard);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Leaderboard">
        <p role="status">Loading leaderboard...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Leaderboard">
        <p role="alert">Unable to load leaderboard: {error}</p>
      </CapabilityCard>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <CapabilityCard title="Leaderboard">
        <p>No leaderboard rankings yet.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Leaderboard">
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.rank}>
                <td>{entry.rank}</td>
                <td>{entry.teamName}</td>
                <td>{entry.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CapabilityCard>
  );
}
