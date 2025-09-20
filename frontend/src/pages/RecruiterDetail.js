import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  Linkedin,
  MapPin,
  Clock,
  FileText,
  MessageCircle,
  Calendar,
  Send,
  Plus,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

const RecruiterDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);
  const [showResumeShareForm, setShowResumeShareForm] = useState(false);

  const queryClient = useQueryClient();

  // Fetch recruiter details
  const { data: recruiterData, isLoading: recruiterLoading } = useQuery(
    ['recruiter', id],
    () => fetch(`/api/recruiters/${id}`).then(res => res.json())
  );

  // Fetch resume history
  const { data: resumeHistoryData } = useQuery(
    ['recruiter-resume-history', id],
    () => fetch(`/api/recruiters/${id}/resume-history`).then(res => res.json()),
    { enabled: !!id }
  );

  // Fetch communications
  const { data: communicationsData } = useQuery(
    ['recruiter-communications', id],
    () => fetch(`/api/recruiters/${id}/communications`).then(res => res.json()),
    { enabled: !!id }
  );

  // Fetch applications via this recruiter
  const { data: applicationsData } = useQuery(
    'applications',
    () => fetch('/api/applications').then(res => res.json())
  );

  if (recruiterLoading) return <div>Loading recruiter details...</div>;

  const recruiter = recruiterData?.recruiter;
  const resumeHistory = resumeHistoryData?.resume_history || [];
  const communications = communicationsData?.communications || [];
  const applications = applicationsData?.applications?.filter(app =>
    app.recruiter_id && app.recruiter_id.toString() === id
  ) || [];

  if (!recruiter) return <div>Recruiter not found</div>;

  const getStatusBadge = (status) => {
    const colors = {
      'new': '#3b82f6',
      'active': '#10b981',
      'cold': '#f59e0b',
      'blocked': '#ef4444'
    };
    return (
      <span style={{
        background: `${colors[status]}15`,
        color: colors[status],
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return 'Never';
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const InfoCard = ({ title, children, icon: Icon }) => (
    <div className="card">
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {Icon && <Icon size={18} />}
        {title}
      </h3>
      {children}
    </div>
  );

  const TabButton = ({ tab, label, count }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '12px 20px',
        border: 'none',
        background: activeTab === tab ? '#3b82f6' : 'transparent',
        color: activeTab === tab ? 'white' : '#6b7280',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
          color: activeTab === tab ? 'white' : '#6b7280',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <Link
          to="/recruiters"
          className="btn btn-secondary"
          style={{ padding: '8px' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {recruiter.name}
            </h1>
            {getStatusBadge(recruiter.relationship_status)}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            {recruiter.primary_contact_name && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} />
                  {recruiter.primary_contact_name}
                </span>
                <span>•</span>
              </>
            )}
            {recruiter.company && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} />
                  {recruiter.company}
                </span>
                <span>•</span>
              </>
            )}
            {recruiter.position_title && (
              <>
                <span>{recruiter.position_title}</span>
                <span>•</span>
              </>
            )}
            <span>Last contact: {getDaysAgo(recruiter.last_contact_date)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary">
            <MessageCircle size={16} />
            Log Communication
          </button>
          <button className="btn btn-primary">
            <Send size={16} />
            Share Resume
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        padding: '8px',
        background: '#f8fafc',
        borderRadius: '12px'
      }}>
        <TabButton tab="overview" label="Overview" />
        <TabButton tab="resumes" label="Resume History" count={resumeHistory.length} />
        <TabButton tab="communications" label="Communications" count={communications.length} />
        <TabButton tab="applications" label="Applications" count={applications.length} />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {/* Contact Information */}
          <InfoCard title="Contact Information" icon={User}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recruiter.primary_contact_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {recruiter.primary_contact_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Primary Contact</div>
                  </div>
                </div>
              )}

              {recruiter.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <a href={`mailto:${recruiter.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {recruiter.email}
                    </a>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Primary Contact Email</div>
                  </div>
                </div>
              )}

              {recruiter.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <a href={`tel:${recruiter.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {recruiter.phone}
                    </a>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Primary Contact Phone</div>
                  </div>
                </div>
              )}

              {recruiter.phone_secondary && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <a href={`tel:${recruiter.phone_secondary}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {recruiter.phone_secondary}
                    </a>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Secondary Contact Phone</div>
                  </div>
                </div>
              )}

              {recruiter.linkedin_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Linkedin size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <a href={recruiter.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      LinkedIn Profile
                    </a>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Professional Network</div>
                  </div>
                </div>
              )}

              {recruiter.office_location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <div>{recruiter.office_location}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Office Location</div>
                  </div>
                </div>
              )}

              {recruiter.preferred_contact_method && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #dbeafe'
                }}>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500', marginBottom: '4px' }}>
                    Preferred Contact Method
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937', textTransform: 'capitalize' }}>
                    {recruiter.preferred_contact_method}
                  </div>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Specialties & Role */}
          <InfoCard title="Professional Details" icon={Briefcase}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recruiter.company && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Company</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{recruiter.company}</div>
                </div>
              )}

              {recruiter.position_title && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Position</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{recruiter.position_title}</div>
                </div>
              )}

              {recruiter.department && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Department</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{recruiter.department}</div>
                </div>
              )}

              {recruiter.specialties && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Specialties</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recruiter.specialties.split(',').map((specialty, index) => (
                      <span key={index} style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {specialty.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recruiter.timezone && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Timezone</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{recruiter.timezone}</div>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Performance Metrics */}
          <InfoCard title="Performance Metrics" icon={TrendingUp}>
            <div className="grid grid-2" style={{ gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                  {applications.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Applications</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {applications.filter(app => ['phone_screen', 'interview', 'offer'].includes(app.status)).length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Interviews+</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {resumeHistory.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Resumes Shared</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {applications.length > 0
                    ? Math.round((applications.filter(app => ['phone_screen', 'interview', 'offer'].includes(app.status)).length / applications.length) * 100)
                    : 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Success Rate</div>
              </div>
            </div>
          </InfoCard>

          {/* Notes */}
          {recruiter.notes && (
            <InfoCard title="Notes" icon={FileText}>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {recruiter.notes}
              </div>
            </InfoCard>
          )}
        </div>
      )}

      {activeTab === 'resumes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Resume Sharing History
            </h2>
            <button className="btn btn-primary">
              <Plus size={16} />
              Share New Resume
            </button>
          </div>

          {resumeHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {resumeHistory.map((share) => (
                <div key={share.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FileText size={16} style={{ color: '#3b82f6' }} />
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {share.version_name}
                        </div>
                        <span style={{
                          background: share.sharing_context === 'job_application' ? '#ecfdf5' : '#eff6ff',
                          color: share.sharing_context === 'job_application' ? '#065f46' : '#2563eb',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {share.sharing_context?.replace('_', ' ') || 'General'}
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        Shared on {format(new Date(share.shared_date), 'MMMM d, yyyy')}
                      </div>

                      {share.job_title && (
                        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                          <strong>Related Job:</strong> {share.job_title}
                        </div>
                      )}

                      {share.notes && (
                        <div style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                          {share.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {getDaysAgo(share.shared_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No resumes shared yet</h3>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                Start tracking which resume versions you've shared with this recruiter
              </p>
              <button className="btn btn-primary">
                <Plus size={16} />
                Share First Resume
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Communication History
            </h2>
            <button className="btn btn-primary">
              <Plus size={16} />
              Log Communication
            </button>
          </div>

          {communications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {communications.map((comm) => (
                <div key={comm.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <MessageCircle size={16} style={{ color: comm.direction === 'outbound' ? '#10b981' : '#3b82f6' }} />
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {comm.direction === 'outbound' ? 'Outbound' : 'Inbound'} {comm.communication_type}
                        </div>
                        {comm.outcome && (
                          <span style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {comm.outcome.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {comm.subject && (
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>
                          {comm.subject}
                        </div>
                      )}

                      {comm.content && (
                        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', lineHeight: '1.5' }}>
                          {comm.content}
                        </div>
                      )}

                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {format(new Date(comm.communication_date), 'MMMM d, yyyy h:mm a')}
                      </div>

                      {comm.follow_up_required && comm.follow_up_date && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: '#fef3c7',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#92400e'
                        }}>
                          📅 Follow-up required by {format(new Date(comm.follow_up_date), 'MMMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <MessageCircle size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No communications logged</h3>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                Start tracking your interactions with this recruiter
              </p>
              <button className="btn btn-primary">
                <Plus size={16} />
                Log First Communication
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Applications via {recruiter.name}
          </h2>

          {applications.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Resume Used</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {app.company_name}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {app.position_title}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#1f2937' }}>
                          {format(new Date(app.application_date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${app.status}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: app.resume_used ? '#eff6ff' : '#f3f4f6',
                            color: app.resume_used ? '#2563eb' : '#6b7280',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {app.resume_used || 'No resume yet'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Briefcase size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No applications via this recruiter</h3>
              <p style={{ margin: '0', color: '#6b7280' }}>
                Applications submitted through this recruiter will appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterDetail;
