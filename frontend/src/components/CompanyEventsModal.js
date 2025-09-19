import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import {
  X,
  Plus,
  Calendar,
  MapPin,
  Briefcase,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react';

const EVENT_OPTIONS = [
  { value: 'market_update', label: 'Market Update' },
  { value: 'recruiter_outreach', label: 'Recruiter Outreach' },
  { value: 'application_followup', label: 'Application Follow-up' },
  { value: 'note', label: 'General Note' }
];

const CompanyEventsModal = ({ company, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'note',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  const { data: eventsData, isLoading } = useQuery(
    ['company-events', company?.id],
    () => fetch(`/api/companies/${company.id}/events`).then(res => res.json()),
    { enabled: !!company?.id }
  );

  const addEventMutation = useMutation(
    async (payload) => {
      const response = await fetch(`/api/companies/${company.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to add company event');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['company-events', company.id]);
        queryClient.invalidateQueries('companies');
        setFormData({
          title: '',
          event_type: 'note',
          event_date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          follow_up_required: false,
          follow_up_date: ''
        });
      }
    }
  );

  const deleteEventMutation = useMutation(
    async (eventId) => {
      const response = await fetch(`/api/company-events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete company event');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['company-events', company.id]);
        queryClient.invalidateQueries('companies');
      },
      onError: (error) => {
        alert(error.message);
      }
    }
  );

  const events = eventsData?.events || [];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addEventMutation.mutateAsync({
        ...formData,
        follow_up_date: formData.follow_up_required ? formData.follow_up_date || null : null
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const renderEventChip = (eventType) => {
    const option = EVENT_OPTIONS.find(opt => opt.value === eventType);
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#FEF3C7',
        color: '#B45309',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        textTransform: 'capitalize'
      }}>
        <Briefcase size={12} />
        {option ? option.label : eventType}
      </span>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>
              Company Timeline
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
              {company?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '0',
          flex: 1,
          minHeight: 0
        }}>
          <div style={{
            padding: '24px',
            borderRight: '1px solid #E5E7EB',
            overflowY: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1F2937'
            }}>
              <Plus size={16} style={{ marginRight: '8px' }} />
              Add Event
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Recruiter reached out about infra role"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Event Type
                </label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {EVENT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Event Date
                </label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add context you want to remember"
                  rows={4}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{
                padding: '12px',
                background: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    name="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={handleInputChange}
                  />
                  Follow-up required
                </label>
                {formData.follow_up_required && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="follow_up_date"
                      value={formData.follow_up_date}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={addEventMutation.isLoading || !formData.title}
              >
                {addEventMutation.isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    <Plus size={16} />
                    Save Event
                  </>
                )}
              </button>
            </form>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Calendar size={18} style={{ color: '#2563EB' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                Timeline
              </h3>
            </div>

            {isLoading ? (
              <div style={{ color: '#6B7280' }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{
                background: '#F9FAFB',
                border: '1px dashed #D1D5DB',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                No events yet. Track outreach and insights to stay ahead.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {events.map(event => (
                  <div
                    key={event.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '16px',
                      background: '#FFFFFF',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                            {event.title}
                          </h4>
                          {renderEventChip(event.event_type)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>
                            {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'Date unknown'}
                          </span>
                          {event.follow_up_required ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#DC2626' }}>
                              <AlertTriangle size={14} />
                              Follow-up {event.follow_up_date ? `by ${format(new Date(event.follow_up_date), 'MMM d, yyyy')}` : 'required'}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16A34A' }}>
                              <CheckCircle size={14} />
                              Logged
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEventMutation.mutate(event.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        disabled={deleteEventMutation.isLoading}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                    {event.description && (
                      <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEventsModal;
