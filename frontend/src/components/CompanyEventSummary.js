import React from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Briefcase } from 'lucide-react';

const CompanyEventSummary = ({ companyId }) => {
  const { data, isLoading } = useQuery(
    ['company-events', companyId],
    () => fetch(`/api/companies/${companyId}/events`).then(res => res.json()),
    {
      enabled: !!companyId,
      staleTime: 1000 * 60 * 5
    }
  );

  if (!companyId) return null;

  const events = data?.events || [];
  const recentEvents = events.slice(0, 3);

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <Briefcase size={14} style={{ color: '#f97316' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
          Recent Events
        </span>
      </div>
      {isLoading ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Loading timeline…</div>
      ) : recentEvents.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          No events logged yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentEvents.map(event => (
            <div key={event.id} style={{ fontSize: '12px', color: '#374151' }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{event.title}</div>
              <div style={{ color: '#6b7280' }}>
                {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'Date unknown'}
                {event.event_type ? ` • ${event.event_type.replace('_', ' ')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyEventSummary;
