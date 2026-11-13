import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

interface Suggestion {
  title: string;
  focus?: string;
  reason?: string;
  [key: string]: unknown;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Default user email for demo
    const userEmail = 'mona@example.com';
    getJson<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((data) => {
        setSuggestions(data.suggestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Workout suggestions">
        <p role="status">Loading workout suggestions...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Workout suggestions">
        <p role="alert">Unable to load workout suggestions: {error}</p>
      </CapabilityCard>
    );
  }

  if (suggestions.length === 0) {
    return (
      <CapabilityCard title="Workout suggestions">
        <p>No workout suggestions available.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions">
      <div className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="list-group-item">
            <h3 className="h5 mb-1">{suggestion.title}</h3>
            {suggestion.focus && <p className="mb-1"><small>Focus: {suggestion.focus}</small></p>}
            {suggestion.reason && <p className="mb-0"><small>Why: {suggestion.reason}</small></p>}
          </div>
        ))}
      </div>
    </CapabilityCard>
  );
}
