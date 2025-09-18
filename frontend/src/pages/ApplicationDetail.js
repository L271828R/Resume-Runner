import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

const ApplicationDetail = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery(
    ['application', id],
    () => fetch(`/api/applications/${id}`).then(res => res.json())
  );

  if (isLoading) return <div>Loading application details...</div>;
  if (error) return <div>Error loading application</div>;

  const app = data?.application;
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
        <button className="btn btn-primary">
          Update Status
        </button>
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
              {app.is_remote !== null && (
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
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  View Resume
                </button>
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

          {/* Job Description */}
          {app.job_description && (
            <InfoCard title="Job Description">
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {app.job_description}
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

          {/* Quick Actions */}
          <InfoCard title="Quick Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary">
                <FileText size={16} />
                View Cover Letter
              </button>
              <button className="btn btn-secondary">
                <ExternalLink size={16} />
                View Job Posting
              </button>
              <button className="btn btn-secondary">
                <Calendar size={16} />
                Schedule Follow-up
              </button>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;