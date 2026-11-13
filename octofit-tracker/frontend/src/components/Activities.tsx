import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

interface Activity {
  type: string;
  minutes: number;
  points: number;
  [key: string]: unknown;
}

interface ActivitiesResponse {
  activities: Activity[];
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ActivitiesResponse>('/api/activities')
      .then((data) => {
        setActivities(data.activities);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Activities">
        <p role="status">Loading activities...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Activities">
        <p role="alert">Unable to load activities: {error}</p>
      </CapabilityCard>
    );
  }

  if (activities.length === 0) {
    return (
      <CapabilityCard title="Activities">
        <p>No activities recorded yet.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Activities">
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Minutes</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index}>
                <td>{activity.type}</td>
                <td>{activity.minutes}</td>
                <td>{activity.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CapabilityCard>
  );
}
