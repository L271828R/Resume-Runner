import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Mail,
  ExternalLink,
  RotateCw,
  Trash2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import ApplicationTimeline from '../components/ApplicationTimeline';

const ApplicationDetail = () => {
  const { id } = useParams();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showChangeResumeModal, setShowChangeResumeModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['application', id],
    () => fetch(`/api/applications/${id}`).then(res => res.json())
  );

  const { data: resumeData } = useQuery(
    'resume-versions-select',
    () => fetch('/api/resume-versions').then(res => res.json())
  );

  const updateResumeMutation = useMutation(
    async (payload) => {
      const response = await fetch(`/api/applications/${id}/resume`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to update resume');
      }

      return response.json();
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['application', id]);
        await queryClient.invalidateQueries('applications');
        setShowChangeResumeModal(false);
      }
    }
  );

  const deleteApplicationMutation = useMutation(
    async () => {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to delete application');
      }
      return response.json();
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries('applications');
        navigate('/applications');
      }
    }
  );

  const app = data?.application;

  useEffect(() => {
    if (showChangeResumeModal && app?.resume_version_id) {
      setSelectedResumeId(String(app.resume_version_id));
    }
  }, [showChangeResumeModal, app?.resume_version_id]);

  if (isLoading) return <div>Loading application details...</div>;
  if (error) return <div>Error loading application</div>;
  if (!app) return <div>Application not found</div>;

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

  const InfoCard = ({ title, children }) => (
    <div className="card">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value, link = null }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <Icon size={16} style={{ color: '#6b7280' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ color: '#1f2937', fontWeight: '500' }}>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              {value} <ExternalLink size={12} style={{ display: 'inline' }} />
            </a>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
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
          to="/applications"
          className="btn btn-secondary"
          style={{ padding: '8px' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {app.position_title}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#6b7280'
          }}>
            <span>at {app.company_name}</span>
            <span>•</span>
            <span>Applied {format(new Date(app.application_date), 'MMMM d, yyyy')}</span>
            <span>•</span>
            {getStatusBadge(app.status)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-danger"
            style={{ background: '#ef4444', color: 'white' }}
            onClick={() => {
              const confirmed = window.confirm('Delete this application? This action cannot be undone.');
              if (confirmed) {
                deleteApplicationMutation.mutate();
              }
            }}
            disabled={deleteApplicationMutation.isLoading}
          >
            <Trash2 size={16} />
            {deleteApplicationMutation.isLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn btn-primary">
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Application Details */}
          <InfoCard title="Application Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <InfoRow
                icon={Building2}
                label="Company"
                value={app.company_name}
                link={app.company_website}
              />
              <InfoRow
                icon={FileText}
                label="Position"
                value={app.position_title}
              />
              <InfoRow
                icon={Calendar}
                label="Application Date"
                value={format(new Date(app.application_date), 'MMMM d, yyyy')}
              />
              {app.response_date && (
                <InfoRow
                  icon={Calendar}
                  label="Response Date"
                  value={format(new Date(app.response_date), 'MMMM d, yyyy')}
                />
              )}
              {app.salary_min && app.salary_max && (
                <InfoRow
                  icon={DollarSign}
                  label="Salary Range"
                  value={`$${app.salary_min.toLocaleString()} - $${app.salary_max.toLocaleString()}`}
                />
              )}
              {app.is_remote !== null && app.is_remote !== undefined && (
                <InfoRow
                  icon={MapPin}
                  label="Work Type"
                  value={app.is_remote ? 'Remote' : 'On-site'}
                />
              )}
            </div>
          </InfoCard>

          {/* Resume Information */}
          <InfoCard title="Resume Version Used">
            <div style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                  {app.resume_version}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => setShowResumeModal(true)}
                  >
                    View Resume
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => setShowChangeResumeModal(true)}
                  >
                    <RotateCw size={14} />
                    Change
                  </button>
                </div>
              </div>
              {app.resume_skills && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    Skills Emphasized:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {app.resume_skills.map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recruiter Information */}
          {app.recruiter_name && (
            <InfoCard title="Recruiter Contact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <InfoRow
                  icon={User}
                  label="Name"
                  value={app.recruiter_name}
                />
                {app.recruiter_email && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={app.recruiter_email}
                    link={`mailto:${app.recruiter_email}`}
                  />
                )}
              </div>
            </InfoCard>
          )}

          {/* Application Timeline */}
          <ApplicationTimeline applicationId={id} />

          {/* Job Description Snapshot */}
          {app.job_posting_text && (
            <InfoCard title="Job Posting Snapshot">
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {app.job_posting_text}
              </div>
            </InfoCard>
          )}

          {/* Notes */}
          {app.outcome_notes && (
            <InfoCard title="Notes">
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {app.outcome_notes}
              </div>
            </InfoCard>
          )}
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            maxWidth: '80vw',
            maxHeight: '80vh',
            width: '800px',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {app.resume_version}
              </h3>
              <button
                onClick={() => setShowResumeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '24px',
              overflow: 'auto',
              flex: 1,
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {app.resume_content || 'Resume content not available'}
            </div>
          </div>
        </div>
      )}

      {/* Change Resume Modal */}
      {showChangeResumeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                Change Resume Version
              </h3>
              <button
                onClick={() => setShowChangeResumeModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Select Resume Version</label>
              <select
                className="form-input"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                <option value="">Select a resume version</option>
                {resumeData?.resume_versions?.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version_name}{version.is_master ? ' (Master)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {updateResumeMutation.isError && (
              <div style={{
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '12px',
                border: '1px solid #fecaca',
                fontSize: '13px'
              }}>
                {updateResumeMutation.error?.message || 'Failed to update resume'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowChangeResumeModal(false)}
                style={{ padding: '8px 12px' }}
                disabled={updateResumeMutation.isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!selectedResumeId) return;
                  updateResumeMutation.mutate({ resume_version_id: selectedResumeId });
                }}
                disabled={updateResumeMutation.isLoading || !selectedResumeId}
                style={{ padding: '8px 12px' }}
              >
                {updateResumeMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
