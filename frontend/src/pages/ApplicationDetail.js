import React, { useState, useEffect, useCallback, memo } from 'react';
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
  Briefcase,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import ApplicationTimeline from '../components/ApplicationTimeline';
import ResumeViewer from '../components/ResumeViewer';

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

const EditableInfoRow = memo(({
  icon: Icon,
  label,
  value,
  link = null,
  field = null,
  inputType = 'text',
  options = null,
  isEditing,
  onValueChange,
  placeholder = '',
  editValue = ''
}) => {
  const renderValue = () => {
    if (link) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none' }}
        >
          {value} <ExternalLink size={12} style={{ display: 'inline' }} />
        </a>
      );
    }
    return value;
  };

  const renderInput = () => {
    if (options) {
      return (
        <select
          className="form-input"
          value={editValue || ''}
          onChange={(e) => onValueChange(field, e.target.value)}
          style={{ fontSize: '14px', padding: '6px 8px', minHeight: 'auto' }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (inputType === 'number') {
      return (
        <input
          type="number"
          className="form-input"
          value={editValue || ''}
          onChange={(e) => onValueChange(field, e.target.value)}
          placeholder={placeholder}
          style={{ fontSize: '14px', padding: '6px 8px', minHeight: 'auto' }}
          min="0"
        />
      );
    }

    if (inputType === 'url') {
      return (
        <input
          type="url"
          className="form-input"
          value={editValue || ''}
          onChange={(e) => onValueChange(field, e.target.value)}
          placeholder={placeholder}
          style={{ fontSize: '14px', padding: '6px 8px', minHeight: 'auto' }}
        />
      );
    }

    return (
      <input
        type="text"
        className="form-input"
        value={editValue || ''}
        onChange={(e) => onValueChange(field, e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: '14px', padding: '6px 8px', minHeight: 'auto' }}
      />
    );
  };

  return (
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
          {isEditing && field ? renderInput() : renderValue()}
        </div>
      </div>
    </div>
  );
});

const ApplicationDetail = () => {
  const { id } = useParams();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeViewerVersion, setResumeViewerVersion] = useState(null);
  const [showChangeResumeModal, setShowChangeResumeModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    position_title: '',
    job_location: '',
    is_remote: 'unknown',
    application_source: '',
    salary_min: '',
    salary_max: '',
    job_url: '',
    outcome_notes: '',
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
    position_title: application?.position_title || '',
    job_location: application?.job_location || '',
    is_remote: deriveRemoteOption(application?.is_remote),
    application_source: application?.application_source || '',
    salary_min: application?.salary_min != null ? String(application.salary_min) : '',
    salary_max: application?.salary_max != null ? String(application.salary_max) : '',
    job_url: application?.job_url || '',
    outcome_notes: application?.outcome_notes || '',
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

  const resumeVersions = resumeData?.resume_versions || [];

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
        setIsEditing(false);
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

  const handleOpenResumeViewer = async () => {
    if (!app) return;

    const normaliseSkills = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (err) {
          // Not JSON, fall through to split
        }
        return value
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean);
      }
      return [];
    };

    let matchedVersion = resumeVersions.find((version) =>
      String(version.id) === String(app.resume_version_id)
    );

    if (!matchedVersion && app.resume_version_id) {
      try {
        const response = await fetch(`/api/resume-versions/${app.resume_version_id}`);
        if (response.ok) {
          const payload = await response.json();
          matchedVersion = payload?.resume_version || null;
        }
      } catch (fetchError) {
        console.error('Failed to fetch resume version for viewer', fetchError);
      }
    }

    if (matchedVersion && matchedVersion.s3_key) {
      setResumeViewerVersion({
        ...matchedVersion,
        skills_emphasized: normaliseSkills(matchedVersion.skills_emphasized),
        created_at: matchedVersion.created_at || app.application_date,
        version_name: matchedVersion.version_name || app.resume_version,
        filename: matchedVersion.filename || app.resume_version,
      });
      setShowResumeModal(true);
      return;
    }

    if (app.resume_content && app.resume_content.trim().length > 0) {
      setResumeViewerVersion(null);
      setShowResumeModal(true);
      return;
    }

    alert('Resume file is not available for this application yet.');
  };

  const handleCloseResumeModal = () => {
    setShowResumeModal(false);
    setResumeViewerVersion(null);
  };

  const handleFormChange = useCallback((field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const getCurrentValues = () => {
    return formValues;
  };

  const handleFormReset = () => {
    setFormValues(convertFromApp(app));
  };

  const handleCancelEdit = () => {
    setFormValues(convertFromApp(app));
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleFormSubmit = (event) => {
    if (event) event.preventDefault();

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

    const applicationSourceValue = formValues.application_source && formValues.application_source.trim().length > 0
      ? formValues.application_source
      : null;

    const payload = {
      position_title: trimOrNull(formValues.position_title),
      job_location: trimOrNull(formValues.job_location),
      is_remote: remoteOptionToValue(formValues.is_remote),
      application_source: applicationSourceValue,
      salary_min: toNumberOrNull(formValues.salary_min),
      salary_max: toNumberOrNull(formValues.salary_max),
      job_url: trimOrNull(formValues.job_url),
      outcome_notes: trimOrNull(formValues.outcome_notes),
      job_posting_text: trimOrNull(formValues.job_posting_text)
    };

    updateApplicationMutation.mutate(payload);
  };

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

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

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
          <InfoCard
            title="Application Details"
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                      disabled={updateApplicationMutation.isLoading}
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleFormSubmit}
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                      disabled={updateApplicationMutation.isLoading}
                    >
                      <Check size={14} />
                      {updateApplicationMutation.isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={handleStartEdit}
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <InfoRow
                icon={Building2}
                label="Company"
                value={app.company_name}
                link={app.company_website}
              />
              <EditableInfoRow
                icon={FileText}
                label="Position"
                value={app.position_title}
                field="position_title"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                placeholder="e.g., Senior Automation Engineer"
                editValue={formValues.position_title}
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
              <EditableInfoRow
                icon={DollarSign}
                label="Salary Min"
                value={app.salary_min ? `$${Number(app.salary_min).toLocaleString()}` : 'Not specified'}
                field="salary_min"
                inputType="number"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                placeholder="e.g., 90000"
                editValue={formValues.salary_min}
              />
              <EditableInfoRow
                icon={DollarSign}
                label="Salary Max"
                value={app.salary_max ? `$${Number(app.salary_max).toLocaleString()}` : 'Not specified'}
                field="salary_max"
                inputType="number"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                placeholder="e.g., 120000"
                editValue={formValues.salary_max}
              />
              <EditableInfoRow
                icon={Briefcase}
                label="Work Type"
                value={remoteDisplayLabel}
                field="is_remote"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                editValue={formValues.is_remote}
                options={[
                  { value: 'unknown', label: 'Not specified' },
                  { value: 'remote', label: 'Remote' },
                  { value: 'onsite', label: 'On-site' }
                ]}
              />
              <EditableInfoRow
                icon={MapPin}
                label="Job Location"
                value={locationDisplay}
                field="job_location"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                placeholder="e.g., New York, NY"
                editValue={formValues.job_location}
              />
              <EditableInfoRow
                icon={Globe}
                label="Application Source"
                value={applicationSourceLabel}
                field="application_source"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                editValue={formValues.application_source}
                options={[
                  { value: '', label: 'Select source' },
                  ...applicationSourceOptions
                ]}
              />
              <EditableInfoRow
                icon={ExternalLink}
                label="Job Posting URL"
                value={jobUrlDisplay || 'Not specified'}
                link={jobUrlDisplay || undefined}
                field="job_url"
                inputType="url"
                isEditing={isEditing}
                onValueChange={handleFormChange}
                placeholder="https://company.com/job"
                editValue={formValues.job_url}
              />
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                  Job Posting Snapshot
                </span>
              </div>
              {isEditing ? (
                <textarea
                  className="form-input"
                  rows={8}
                  style={{ resize: 'vertical', fontSize: '14px' }}
                  value={formValues.job_posting_text}
                  onChange={(e) => handleFormChange('job_posting_text', e.target.value)}
                  placeholder="Paste or write the job description here"
                />
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
                    : 'No description captured yet.'}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                  Internal Notes
                </span>
              </div>
              {isEditing ? (
                <textarea
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical', fontSize: '14px' }}
                  value={formValues.outcome_notes}
                  onChange={(e) => handleFormChange('outcome_notes', e.target.value)}
                  placeholder="Add private notes about this application"
                />
              ) : (
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  background: '#f9fafb',
                  minHeight: '40px'
                }}>
                  {app.outcome_notes && app.outcome_notes.trim().length > 0 ? app.outcome_notes : 'No internal notes yet.'}
                </div>
              )}
            </div>
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
                    onClick={handleOpenResumeViewer}
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
        resumeViewerVersion ? (
          <ResumeViewer
            version={resumeViewerVersion}
            onClose={handleCloseResumeModal}
          />
        ) : (
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
                  onClick={handleCloseResumeModal}
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
        )
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
