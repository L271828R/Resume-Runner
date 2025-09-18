import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  Video,
  FileText,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Target,
  Send,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

const ApplicationTimeline = ({ applicationId }) => {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const queryClient = useQueryClient();

  // Fetch timeline
  const { data: timelineData, isLoading } = useQuery(
    ['application-timeline', applicationId],
    () => fetch(`/api/applications/${applicationId}/timeline`).then(res => res.json()),
    { enabled: !!applicationId }
  );

  // Add event mutation
  const addEventMutation = useMutation(
    async (eventData) => {
      const response = await fetch(`/api/applications/${applicationId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error('Failed to add event');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['application-timeline', applicationId]);
        setShowAddEvent(false);
      },
    }
  );

  // Update event mutation
  const updateEventMutation = useMutation(
    async ({ eventId, data }) => {
      const response = await fetch(`/api/application-events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['application-timeline', applicationId]);
        setEditingEvent(null);
      },
    }
  );

  // Delete event mutation
  const deleteEventMutation = useMutation(
    async (eventId) => {
      const response = await fetch(`/api/application-events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['application-timeline', applicationId]);
      },
    }
  );

  const getEventIcon = (eventType) => {
    const icons = {
      'application_submitted': Send,
      'recruiter_contact': User,
      'phone_screen': Phone,
      'technical_interview': FileText,
      'onsite_interview': MapPin,
      'video_interview': Video,
      'follow_up': MessageCircle,
      'status_change': Target,
      'custom': Star
    };
    return icons[eventType] || Calendar;
  };

  const getEventColor = (eventType, outcome) => {
    if (outcome === 'positive') return '#10b981';
    if (outcome === 'negative') return '#ef4444';
    if (outcome === 'pending') return '#f59e0b';

    const colors = {
      'application_submitted': '#3b82f6',
      'recruiter_contact': '#8b5cf6',
      'phone_screen': '#f59e0b',
      'technical_interview': '#10b981',
      'onsite_interview': '#059669',
      'video_interview': '#06b6d4',
      'follow_up': '#6b7280',
      'status_change': '#3b82f6',
      'custom': '#ec4899'
    };
    return colors[eventType] || '#6b7280';
  };

  const getOutcomeBadge = (outcome) => {
    if (!outcome) return null;

    const configs = {
      'positive': { color: '#10b981', icon: CheckCircle, label: 'Positive' },
      'negative': { color: '#ef4444', icon: XCircle, label: 'Negative' },
      'neutral': { color: '#6b7280', icon: AlertCircle, label: 'Neutral' },
      'pending': { color: '#f59e0b', icon: Clock, label: 'Pending' }
    };

    const config = configs[outcome];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: `${config.color}15`,
        color: config.color,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const TimelineEvent = ({ event }) => {
    const Icon = getEventIcon(event.event_type);
    const color = getEventColor(event.event_type, event.outcome);

    return (
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {/* Timeline dot */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `${color}15`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={16} style={{ color }} />
        </div>

        {/* Event content */}
        <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {event.title}
                </h4>
                {getOutcomeBadge(event.outcome)}
              </div>

              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {format(new Date(event.event_date), 'MMMM d, yyyy')}
                </span>
                {event.event_time && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {event.event_time}
                  </span>
                )}
                {event.duration_minutes && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    ({event.duration_minutes} min)
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditingEvent(event)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    deleteEventMutation.mutate(event.id);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {event.description && (
            <div style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
              marginBottom: '12px'
            }}>
              {event.description}
            </div>
          )}

          {(event.location || event.meeting_link || event.attendees) && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '12px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {event.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {event.location}
                </span>
              )}
              {event.meeting_link && (
                <a
                  href={event.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#3b82f6',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={12} />
                  Meeting Link
                </a>
              )}
              {event.attendees && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} />
                  {JSON.parse(event.attendees).join(', ')}
                </span>
              )}
            </div>
          )}

          {event.next_steps && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '4px'
              }}>
                Next Steps:
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                {event.next_steps}
              </div>
            </div>
          )}

          {event.follow_up_required && event.follow_up_date && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={12} />
              Follow-up required by {format(new Date(event.follow_up_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const EventForm = ({ event, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      event_type: event?.event_type || 'custom',
      event_date: event?.event_date || new Date().toISOString().split('T')[0],
      event_time: event?.event_time || '',
      title: event?.title || '',
      description: event?.description || '',
      outcome: event?.outcome || '',
      next_steps: event?.next_steps || '',
      location: event?.location || '',
      meeting_link: event?.meeting_link || '',
      duration_minutes: event?.duration_minutes || '',
      follow_up_required: event?.follow_up_required || false,
      follow_up_date: event?.follow_up_date || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const eventTypes = [
      { value: 'recruiter_contact', label: 'Recruiter Contact' },
      { value: 'phone_screen', label: 'Phone Screen' },
      { value: 'technical_interview', label: 'Technical Interview' },
      { value: 'video_interview', label: 'Video Interview' },
      { value: 'onsite_interview', label: 'Onsite Interview' },
      { value: 'follow_up', label: 'Follow-up' },
      { value: 'status_change', label: 'Status Change' },
      { value: 'custom', label: 'Custom Event' }
    ];

    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          {event ? 'Edit Event' : 'Add New Event'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Event Type *</label>
              <select
                className="form-input"
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                required
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Phone Screen with Sarah"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed notes about this event..."
            />
          </div>

          <div className="grid grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Outcome</label>
              <select
                className="form-input"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              >
                <option value="">No outcome yet</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input
                type="number"
                className="form-input"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office address or 'Remote'"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Meeting Link</label>
              <input
                type="url"
                className="form-input"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Next Steps</label>
            <textarea
              className="form-textarea"
              rows="2"
              value={formData.next_steps}
              onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
              placeholder="What needs to happen next..."
            />
          </div>

          <div className="grid grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.follow_up_required}
                  onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                />
                Follow-up required
              </label>
            </div>

            {formData.follow_up_required && (
              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary">
              {event ? 'Update Event' : 'Add Event'}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (isLoading) return <div>Loading timeline...</div>;

  const timeline = timelineData?.timeline || [];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
          Application Timeline
        </h3>
        <button
          onClick={() => setShowAddEvent(true)}
          className="btn btn-primary"
          style={{ fontSize: '14px' }}
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {showAddEvent && (
        <EventForm
          onSubmit={(data) => addEventMutation.mutate(data)}
          onCancel={() => setShowAddEvent(false)}
        />
      )}

      {editingEvent && (
        <EventForm
          event={editingEvent}
          onSubmit={(data) => updateEventMutation.mutate({ eventId: editingEvent.id, data })}
          onCancel={() => setEditingEvent(null)}
        />
      )}

      {timeline.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '40px',
            bottom: '0',
            width: '2px',
            background: '#e5e7eb'
          }} />

          {timeline.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No timeline events yet</h3>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
            Start tracking your application journey with events and milestones
          </p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add First Event
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;