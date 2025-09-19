import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Plus,
  User,
  Search,
  Mail,
  Phone,
  Linkedin,
  Building2,
  FileText,
  Calendar,
  TrendingUp,
  Star,
  MessageCircle,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import RecruiterForm from '../components/RecruiterForm';
import RecruiterEventSummary from '../components/RecruiterEventSummary';
import RecruiterEventsModal from '../components/RecruiterEventsModal';

const Recruiters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecruiterForm, setShowRecruiterForm] = useState(false);
  const [recruiterToEdit, setRecruiterToEdit] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [recruiterForEvents, setRecruiterForEvents] = useState(null);
  const [sortOption, setSortOption] = useState('name');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    'recruiter-dashboard',
    () => fetch('/api/recruiters/dashboard').then(res => res.json())
  );

  const createRecruiterMutation = useMutation(
    async (payload) => {
      const response = await fetch('/api/recruiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create recruiter');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recruiter-dashboard');
        setShowRecruiterForm(false);
        setRecruiterToEdit(null);
      }
    }
  );

  const updateRecruiterMutation = useMutation(
    async ({ id, ...payload }) => {
      const response = await fetch(`/api/recruiters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update recruiter');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recruiter-dashboard');
        setShowRecruiterForm(false);
        setRecruiterToEdit(null);
      }
    }
  );

  const toggleStarMutation = useMutation(
    async ({ id, is_starred }) => {
      const response = await fetch(`/api/recruiters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update recruiter');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recruiter-dashboard');
      }
    }
  );

  const handleEditRecruiter = (recruiter) => {
    setRecruiterToEdit(recruiter);
    setShowRecruiterForm(true);
  };

  const handleShowEvents = (recruiter) => {
    setRecruiterForEvents(recruiter);
    setShowEventsModal(true);
  };

  if (isLoading) return <div>Loading recruiters...</div>;
  if (error) return <div>Error loading recruiters</div>;

  const recruiters = data?.recruiters || [];

  const filteredRecruiters = recruiters.filter(recruiter => {
    const matchesSearch =
      recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recruiter.primary_contact_name && recruiter.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recruiter.company && recruiter.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recruiter.specialties && recruiter.specialties.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || recruiter.relationship_status === statusFilter;

    const matchesStar = !showStarredOnly || recruiter.is_starred;

    return matchesSearch && matchesStatus && matchesStar;
  });

  const parseDate = (value) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortedRecruiters = [...filteredRecruiters].sort((a, b) => {
    const starCompare = Number(b.is_starred) - Number(a.is_starred);
    if (starCompare !== 0) {
      return starCompare;
    }

    if (sortOption === 'updated' || sortOption === 'starred') {
      const updatedCompare = parseDate(b.updated_at) - parseDate(a.updated_at);
      if (updatedCompare !== 0) {
        return updatedCompare;
      }
    }

    return a.name.localeCompare(b.name);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'new': return '#3b82f6';
      case 'cold': return '#f59e0b';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status) => (
    <span style={{
      background: `${getStatusColor(status)}15`,
      color: getStatusColor(status),
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {status.replace('_', ' ')}
    </span>
  );

  const getSuccessRateColor = (rate) => {
    if (rate >= 30) return '#10b981';
    if (rate >= 15) return '#f59e0b';
    return '#ef4444';
  };

  const statuses = ['all', 'new', 'active', 'cold', 'blocked'];

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
            Recruiters
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            Manage your recruiter relationships and track resume versions
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setRecruiterToEdit(null);
            setShowRecruiterForm(true);
          }}
        >
          <Plus size={16} />
          Add Recruiter
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="text"
              placeholder="Search recruiters, companies, or specialties..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '140px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '160px' }}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="updated">Sort by Last Updated</option>
              <option value="starred">Starred First</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
            <input
              type="checkbox"
              checked={showStarredOnly}
              onChange={(e) => setShowStarredOnly(e.target.checked)}
            />
            Starred only
          </label>
        </div>
      </div>

      {/* Recruiters Grid */}
      {sortedRecruiters.length > 0 ? (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {sortedRecruiters.map((recruiter) => (
            <div key={recruiter.id} className="card">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {recruiter.name}
                  </h3>
                  {getStatusBadge(recruiter.relationship_status)}
                </div>

                {recruiter.updated_at && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Updated {format(new Date(recruiter.updated_at), 'MMM d, yyyy')}
                  </div>
                )}

                {recruiter.primary_contact_name && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <User size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Primary contact: {recruiter.primary_contact_name}
                    </span>
                  </div>
                )}

                  {recruiter.company && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Building2 size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {recruiter.company}
                      </span>
                    </div>
                  )}

                  {recruiter.specialties && (
                    <div style={{
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '12px',
                      fontStyle: 'italic'
                    }}>
                      Specializes in: {recruiter.specialties}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => toggleStarMutation.mutate({ id: recruiter.id, is_starred: recruiter.is_starred ? 0 : 1 })}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    aria-label={recruiter.is_starred ? 'Unstar recruiter' : 'Star recruiter'}
                    disabled={toggleStarMutation.isLoading}
                  >
                    <Star
                      size={14}
                      style={{ color: recruiter.is_starred ? '#facc15' : '#d1d5db' }}
                      fill={recruiter.is_starred ? '#facc15' : 'none'}
                    />
                    {recruiter.is_starred ? 'Starred' : 'Star' }
                  </button>

                  {recruiter.success_rate > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Star
                        size={14}
                        style={{ color: getSuccessRateColor(recruiter.success_rate) }}
                      />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: getSuccessRateColor(recruiter.success_rate)
                      }}>
                        {recruiter.success_rate}% success
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <RecruiterEventSummary recruiterId={recruiter.id} />

              {/* Contact Information */}
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <MessageCircle size={16} style={{ color: '#6b7280' }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Contact Information
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recruiter.primary_contact_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                        {recruiter.primary_contact_name}
                      </span>
                    </div>
                  )}

                  {recruiter.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: '#6b7280' }} />
                      <a
                        href={`mailto:${recruiter.email}`}
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                      >
                        {recruiter.email}
                      </a>
                    </div>
                  )}

                  {recruiter.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: '#6b7280' }} />
                      <a
                        href={`tel:${recruiter.phone}`}
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                      >
                        {recruiter.phone}
                      </a>
                    </div>
                  )}

                  {recruiter.linkedin_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Linkedin size={14} style={{ color: '#6b7280' }} />
                      <a
                        href={recruiter.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}

                  {recruiter.last_contact_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Last contact: {format(new Date(recruiter.last_contact_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Version */}
              {recruiter.current_resume_version && (
                <div style={{
                  background: '#eff6ff',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <FileText size={14} style={{ color: '#2563eb' }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Current Resume Version
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#2563eb',
                    fontWeight: '500'
                  }}>
                    {recruiter.current_resume_version}
                  </div>
                </div>
              )}

              {/* Recent Applications */}
              {recruiter.recent_applications && recruiter.recent_applications.trim() && (
                <div style={{
                  background: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #dcfce7',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <TrendingUp size={14} style={{ color: '#16a34a' }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Recent Applications
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#166534', lineHeight: '1.4' }}>
                    {recruiter.recent_applications.split('; ').filter(app => app.trim()).map((application, index) => {
                      const [company, position, date, status] = application.split('|');
                      if (!company || !position) return null;
                      return (
                        <div key={index} style={{ marginBottom: '4px' }}>
                          <strong>{position}</strong> at <strong>{company}</strong>
                          {date && (
                            <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                              ({format(new Date(date), 'MMM d, yyyy')})
                            </span>
                          )}
                          {status && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '12px',
                              background: status === 'offer' ? '#dcfce7' :
                                        status === 'interview' ? '#dbeafe' :
                                        status === 'phone_screen' ? '#fef3c7' : '#f3f4f6',
                              color: status === 'offer' ? '#166534' :
                                    status === 'interview' ? '#1e40af' :
                                    status === 'phone_screen' ? '#92400e' : '#374151'
                            }}>
                              {status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {recruiter.notes && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    Notes:
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {recruiter.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => handleShowEvents(recruiter)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  <MessageCircle size={12} style={{ marginRight: '4px' }} />
                  View Timeline
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '12px' }}>
                  Update Resume
                </button>
                <button
                  onClick={() => handleEditRecruiter(recruiter)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  <Edit size={12} style={{ marginRight: '4px' }} />
                  Edit
                </button>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: '12px' }}>
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '64px 32px'
          }}>
            <User size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {searchTerm || statusFilter !== 'all' ? 'No matching recruiters' : 'No recruiters yet'}
            </h3>
            <p style={{ margin: '0 0 16px 0' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your recruiter network to track relationships and resume versions'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button className="btn btn-primary">
                <Plus size={16} />
                Add Your First Recruiter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {sortedRecruiters.length > 0 && !searchTerm && statusFilter === 'all' && (
        <div className="card" style={{ marginTop: '32px' }}>
          <h2 style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Recruiter Network Summary
          </h2>
          <div className="grid grid-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
                {recruiters.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total Recruiters
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                {recruiters.filter(r => r.relationship_status === 'active').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Active Relationships
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
                {recruiters.filter(r => r.current_resume_version).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Have Current Resume
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                {Math.round(
                  recruiters.reduce((sum, r) => sum + (r.success_rate || 0), 0) /
                  Math.max(recruiters.filter(r => r.success_rate > 0).length, 1)
                ) || 0}%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Avg Success Rate
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecruiterForm && (
        <RecruiterForm
          recruiter={recruiterToEdit}
          onClose={() => {
            setShowRecruiterForm(false);
            setRecruiterToEdit(null);
          }}
          onSubmit={(formValues) =>
            recruiterToEdit
              ? updateRecruiterMutation.mutateAsync({ id: recruiterToEdit.id, ...formValues })
              : createRecruiterMutation.mutateAsync(formValues)
          }
        />
      )}

      {showEventsModal && recruiterForEvents && (
        <RecruiterEventsModal
          recruiter={recruiterForEvents}
          onClose={() => {
            setShowEventsModal(false);
            setRecruiterForEvents(null);
          }}
        />
      )}
    </div>
  );
};

export default Recruiters;
