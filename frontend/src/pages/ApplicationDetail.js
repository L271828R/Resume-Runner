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
  XCircle,
  Globe,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import ApplicationTimeline from '../components/ApplicationTimeline';

const ApplicationDetail = () => {
  const { id } = useParams();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showChangeResumeModal, setShowChangeResumeModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [formValues, setFormValues] = useState({
    job_location: '',
    is_remote: 'unknown',
    application_source: '',
    salary_min: '',
    salary_max: '',
    job_url: '',
    notes: '',
    job_posting_text: ''
  });

  const deriveRemoteOption = (value) => {
    if (value === 1 || value === true || value === '1' || value === 'true' || value === 'remote') {
      return 'remote';
    }
    if (value === 0 || value === false || value === '0' || value === 'false' || value === 'onsite') {
      return 'onsite';
    }
    return 'unknown';
  };

  const remoteOptionToValue = (option) => {
    if (option === 'remote') return 1;
    if (option === 'onsite') return 0;
    return null;
  };

  const convertFromApp = (application) => ({
    job_location: application?.job_location || '',
    is_remote: deriveRemoteOption(application?.is_remote),
    application_source: application?.application_source || '',
    salary_min: application?.salary_min != null ? String(application.salary_min) : '',
    salary_max: application?.salary_max != null ? String(application.salary_max) : '',
    job_url: application?.job_url || '',
    notes: application?.notes || '',
    job_posting_text: application?.job_posting_text || ''
  });

  const applicationSourceOptions = [
    { value: 'indeed', label: 'Indeed' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'company_website', label: 'Company Website' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'recruiter', label: 'Recruiter Contact' },
    { value: 'referral', label: 'Employee Referral' },
    { value: 'job_board', label: 'Other Job Board' },
    { value: 'direct_application', label: 'Direct Application' },
    { value: 'networking', label: 'Networking Event' },
    { value: 'headhunter', label: 'Headhunter' }
  ];

  const getApplicationSourceLabel = (value) => {
    if (!value) return 'Not specified';
    const match = applicationSourceOptions.find(option => option.value === value);
    return match ? match.label : value;
  };

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

  const updateApplicationMutation = useMutation(
    async (payload) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to update application');
      }

      return response.json();
    },
    {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(['application', id]);
        await queryClient.invalidateQueries('applications');
        const updatedApplication = data?.application;
        if (updatedApplication) {
          setFormValues(convertFromApp(updatedApplication));
        }
      },
      onError: (error) => {
        const message = error?.message || 'Failed to update application';
        alert(message);
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

  useEffect(() => {
    setFormValues(convertFromApp(app));
  }, [app]);

  if (isLoading) return <div>Loading application details...</div>;
  if (error) return <div>Error loading application</div>;
  if (!app) return <div>Application not found</div>;

  const remoteOption = deriveRemoteOption(app.is_remote);
  const remoteDisplayLabel = remoteOption === 'remote'
    ? 'Remote'
    : remoteOption === 'onsite'
      ? 'On-site'
      : 'Not specified';
  const locationDisplay = app.job_location && app.job_location.trim().length > 0
    ? app.job_location
    : 'Not specified';
  const applicationSourceLabel = getApplicationSourceLabel(app.application_source);
  const salaryDisplay = (() => {
    const hasMin = typeof app.salary_min === 'number';
    const hasMax = typeof app.salary_max === 'number';
    if (hasMin && hasMax) {
      return `$${app.salary_min.toLocaleString()} - $${app.salary_max.toLocaleString()}`;
    }
    if (hasMin) {
      return `Min $${app.salary_min.toLocaleString()}`;
    }
    if (hasMax) {
      return `Max $${app.salary_max.toLocaleString()}`;
    }
    return 'Not specified';
  })();
  const jobUrlDisplay = app.job_url && app.job_url.trim().length > 0 ? app.job_url : null;
  const notesDisplay = app.notes && app.notes.trim().length > 0 ? app.notes : 'No internal notes yet.';

  const handleMetaCancel = () => {
    setMetaDraft({
      job_location: app?.job_location || '',
      is_remote: deriveRemoteOption(app?.is_remote)
    });
    setIsEditingMeta(false);
  };

  const handleMetaSave = () => {
    const trimOrNull = (value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const toNumberOrNull = (value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const applicationSourceValue = metaDraft.application_source && metaDraft.application_source.trim().length > 0
      ? metaDraft.application_source
      : null;

    const payload = {
      job_location: trimOrNull(metaDraft.job_location),
      is_remote: remoteOptionToValue(metaDraft.is_remote),
      application_source: applicationSourceValue,
      salary_min: toNumberOrNull(metaDraft.salary_min),
      salary_max: toNumberOrNull(metaDraft.salary_max),
      job_url: trimOrNull(metaDraft.job_url),
      notes: trimOrNull(metaDraft.notes)
    };
    updateApplicationMutation.mutate(payload);
  };

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

  const InfoCard = ({ title, actions = null, children }) => (
    <div className="card">
      <div style={{
        display: 'flex',
        alignItems: actions ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          {title}
        </h3>
        {actions ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {actions}
          </div>
        ) : null}
      </div>
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
          <InfoCard
            title="Application Details"
            actions={
              isEditingMeta ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleMetaCancel}
                    disabled={updateApplicationMutation.isLoading}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleMetaSave}
                    disabled={updateApplicationMutation.isLoading}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    {updateApplicationMutation.isLoading ? 'Saving...' : 'Save Details'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => setIsEditingMeta(true)}
                >
                  Edit Details
                </button>
              )
            }
          >
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
              <InfoRow
                icon={DollarSign}
                label="Salary"
                value={salaryDisplay}
              />
              <InfoRow
                icon={Briefcase}
                label="Work Type"
                value={remoteDisplayLabel}
              />
              <InfoRow
                icon={MapPin}
                label="Job Location"
                value={locationDisplay}
              />
              <InfoRow
                icon={Globe}
                label="Application Source"
                value={applicationSourceLabel}
              />
              <InfoRow
                icon={ExternalLink}
                label="Job Posting URL"
                value={jobUrlDisplay || 'Not specified'}
                link={jobUrlDisplay || undefined}
              />
            </div>

            {isEditingMeta && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                  Work Type
                </label>
                <select
                  className="form-input"
                  value={metaDraft.is_remote}
                  onChange={(e) => setMetaDraft(prev => ({ ...prev, is_remote: e.target.value }))}
                >
                  <option value="unknown">Not specified</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                  Job Location
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={metaDraft.job_location}
                  onChange={(e) => setMetaDraft(prev => ({ ...prev, job_location: e.target.value }))}
                  placeholder="e.g., New York, NY or San Francisco, CA"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                  Application Source
                </label>
                <select
                  className="form-input"
                  value={metaDraft.application_source}
                  onChange={(e) => setMetaDraft(prev => ({ ...prev, application_source: e.target.value }))}
                >
                  <option value="">Select source</option>
                  {applicationSourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                    Salary Min
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={metaDraft.salary_min}
                    onChange={(e) => setMetaDraft(prev => ({ ...prev, salary_min: e.target.value }))}
                    placeholder="e.g., 90000"
                    min="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                    Salary Max
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={metaDraft.salary_max}
                    onChange={(e) => setMetaDraft(prev => ({ ...prev, salary_max: e.target.value }))}
                    placeholder="e.g., 120000"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                  Job Posting URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={metaDraft.job_url}
                  onChange={(e) => setMetaDraft(prev => ({ ...prev, job_url: e.target.value }))}
                  placeholder="https://company.com/job"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>
                  Internal Notes
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={metaDraft.notes}
                  onChange={(e) => setMetaDraft(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add private notes about this application"
                />
              </div>
            </div>
          )}

            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                  Job Posting Snapshot
                </span>
                {!isEditingDescription && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => setIsEditingDescription(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <>
                  <textarea
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    rows={10}
                    className="form-input"
                    style={{ resize: 'vertical', minHeight: '160px' }}
                    placeholder="Paste or write the job description here"
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setDescriptionDraft(app?.job_posting_text || '');
                        setIsEditingDescription(false);
                      }}
                      disabled={updateApplicationMutation.isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => updateApplicationMutation.mutate({ job_posting_text: descriptionDraft })}
                      disabled={updateApplicationMutation.isLoading}
                    >
                      {updateApplicationMutation.isLoading ? 'Saving...' : 'Save Description'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  background: '#f9fafb'
                }}>
                  {app.job_posting_text && app.job_posting_text.trim().length > 0
                    ? app.job_posting_text
                    : 'No description captured yet. Click Edit to add one.'}
                </div>
              )}
            </div>

            {!isEditingMeta && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>
                  Internal Notes
                </div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                  {notesDisplay}
                </div>
              </div>
            )}
          </InfoCard>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
