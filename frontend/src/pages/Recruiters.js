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
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import RecruiterForm from '../components/RecruiterForm';

const Recruiters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecruiterForm, setShowRecruiterForm] = useState(false);

  const { data, isLoading, error } = useQuery(
    'recruiter-dashboard',
    () => fetch('/api/recruiters/dashboard').then(res => res.json())
  );

  if (isLoading) return <div>Loading recruiters...</div>;
  if (error) return <div>Error loading recruiters</div>;

  const recruiters = data?.recruiters || [];

  const filteredRecruiters = recruiters.filter(recruiter => {
    const matchesSearch =
      recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recruiter.company && recruiter.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recruiter.specialties && recruiter.specialties.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || recruiter.relationship_status === statusFilter;

    return matchesSearch && matchesStatus;
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
          onClick={() => setShowRecruiterForm(true)}
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
        </div>
      </div>

      {/* Recruiters Grid */}
      {filteredRecruiters.length > 0 ? (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {filteredRecruiters.map((recruiter) => (
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
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '12px' }}>
                  Update Resume
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
      {filteredRecruiters.length > 0 && !searchTerm && statusFilter === 'all' && (
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
          onClose={() => setShowRecruiterForm(false)}
        />
      )}
    </div>
  );
};

export default Recruiters;