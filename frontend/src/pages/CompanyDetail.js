import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Briefcase,
  FileText,
  Target,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

const CompanyDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch company details
  const { data: companyData, isLoading: companyLoading } = useQuery(
    ['company-details', id],
    () => fetch(`/api/companies/${id}/details`).then(res => res.json())
  );

  // Fetch company job postings
  const { data: jobsData } = useQuery(
    ['company-jobs', id],
    () => fetch(`/api/companies/${id}/jobs`).then(res => res.json()),
    { enabled: !!id }
  );

  // Fetch company applications
  const { data: applicationsData } = useQuery(
    ['company-applications', id],
    () => fetch(`/api/companies/${id}/applications`).then(res => res.json()),
    { enabled: !!id }
  );

  // Fetch company stats
  const { data: statsData } = useQuery(
    ['company-stats', id],
    () => fetch(`/api/companies/${id}/stats`).then(res => res.json()),
    { enabled: !!id }
  );

  if (companyLoading) return <div>Loading company details...</div>;

  const company = companyData?.company;
  const jobs = jobsData?.job_postings || [];
  const applications = applicationsData?.applications || [];
  const stats = statsData?.stats || {};

  if (!company) return <div>Company not found</div>;

  const getStatusBadge = (status) => {
    const colors = {
      'applied': '#3b82f6',
      'phone_screen': '#f59e0b',
      'interview': '#10b981',
      'offer': '#059669',
      'rejected': '#ef4444',
      'withdrawn': '#6b7280'
    };
    return (
      <span style={{
        background: `${colors[status]}15`,
        color: colors[status],
        padding: '4px 8px',
        borderRadius: '4px',
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
          to="/companies"
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
              {company.name}
            </h1>
            {company.is_remote_friendly && (
              <span style={{
                background: '#dcfce7',
                color: '#16a34a',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Remote Friendly
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            {company.industry && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} />
                  {company.industry}
                </span>
                <span>•</span>
              </>
            )}
            {company.company_size && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} />
                  {company.company_size}
                </span>
                <span>•</span>
              </>
            )}
            {company.headquarters && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} />
                {company.headquarters}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Globe size={16} />
              Visit Website
            </a>
          )}
          <button className="btn btn-primary">
            <Plus size={16} />
            New Application
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
        <TabButton tab="jobs" label="Job Postings" count={jobs.length} />
        <TabButton tab="applications" label="My Applications" count={applications.length} />
        <TabButton tab="analytics" label="Analytics" />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {/* Company Information */}
          <InfoCard title="Company Information" icon={Building2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {company.website && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Website</div>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {company.website.replace('https://', '').replace('http://', '')}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {company.industry && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Industry</div>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>{company.industry}</div>
                </div>
              )}

              {company.company_size && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Company Size</div>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>{company.company_size}</div>
                </div>
              )}

              {company.headquarters && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Headquarters</div>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>{company.headquarters}</div>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Key Metrics */}
          <InfoCard title="Application Metrics" icon={TrendingUp}>
            <div className="grid grid-2" style={{ gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                  {stats.total_jobs || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Job Postings</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {stats.total_applications || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Applications</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {stats.interviews_plus || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Interviews+</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {stats.success_rate || 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Success Rate</div>
              </div>
            </div>

            {stats.avg_salary_min && stats.avg_salary_max && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#eff6ff',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '500' }}>
                  Average Salary Range
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginTop: '4px' }}>
                  ${Math.round(stats.avg_salary_min / 1000)}k - ${Math.round(stats.avg_salary_max / 1000)}k
                </div>
              </div>
            )}
          </InfoCard>

          {/* Recent Activity */}
          <InfoCard title="Recent Activity" icon={Calendar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.last_application && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={16} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      Last Application
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {getDaysAgo(stats.last_application)}
                    </div>
                  </div>
                </div>
              )}

              {stats.first_application && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Target size={16} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      First Application
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {format(new Date(stats.first_application), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {company.last_job_posted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={16} style={{ color: '#f59e0b' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                      Last Job Posted
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {getDaysAgo(company.last_job_posted)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Application Status Breakdown */}
          {applications.length > 0 && (
            <InfoCard title="Application Status" icon={CheckCircle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['applied', 'phone_screen', 'interview', 'offer', 'rejected'].map(status => {
                  const count = applications.filter(app => app.status === status).length;
                  if (count === 0) return null;
                  return (
                    <div key={status} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(status)}
                        <span style={{ fontSize: '14px', color: '#1f2937', textTransform: 'capitalize' }}>
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Job Postings at {company.name}
            </h2>
            <button className="btn btn-primary">
              <Plus size={16} />
              Track New Job
            </button>
          </div>

          {jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {jobs.map((job) => (
                <div key={job.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                          {job.title}
                        </h3>
                        {job.is_remote && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#16a34a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Remote
                          </span>
                        )}
                      </div>

                      {job.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <MapPin size={14} style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>{job.location}</span>
                        </div>
                      )}

                      {(job.salary_min || job.salary_max) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <DollarSign size={14} style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {job.salary_min && job.salary_max
                              ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
                              : job.salary_min
                              ? `$${Math.round(job.salary_min / 1000)}k+`
                              : `Up to $${Math.round(job.salary_max / 1000)}k`
                            }
                          </span>
                        </div>
                      )}

                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Posted {job.date_posted ? getDaysAgo(job.date_posted) : 'Recently'}
                        {job.applications_count > 0 && (
                          <span style={{ marginLeft: '12px', color: '#3b82f6', fontWeight: '500' }}>
                            • {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          marginTop: '8px',
                          lineHeight: '1.5'
                        }}>
                          {job.description.substring(0, 200)}...
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      <button className="btn btn-primary" style={{ fontSize: '12px' }}>
                        Apply Now
                      </button>
                      {job.job_board_url && (
                        <a
                          href={job.job_board_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}
                        >
                          <ExternalLink size={12} />
                          View Original
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Briefcase size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No job postings tracked</h3>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                Start tracking job postings from {company.name} to monitor opportunities
              </p>
              <button className="btn btn-primary">
                <Plus size={16} />
                Track First Job Posting
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            My Applications to {company.name}
          </h2>

          {applications.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Resume Used</th>
                    <th>Recruiter</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {app.position_title}
                        </div>
                        {app.job_posting_title && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Job Posting: {app.job_posting_title}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ color: '#1f2937' }}>
                          {format(new Date(app.application_date), 'MMM d, yyyy')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {getDaysAgo(app.application_date)}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(app.status)}
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
                      <td>
                        {app.recruiter_name ? (
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>
                            {app.recruiter_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                            Direct
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/applications/${app.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', textDecoration: 'none' }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No applications yet</h3>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                Start applying to jobs at {company.name} and track your progress
              </p>
              <button className="btn btn-primary">
                <Plus size={16} />
                Submit First Application
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Analytics for {company.name}
          </h2>

          <div className="grid grid-2" style={{ gap: '24px' }}>
            <InfoCard title="Application Timeline" icon={TrendingUp}>
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                Application timeline chart would go here
              </div>
            </InfoCard>

            <InfoCard title="Success Metrics" icon={Target}>
              <div className="grid grid-2" style={{ gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                    {stats.rejections || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Rejections</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {stats.offers || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Offers</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                    {applications.filter(app => ['applied', 'phone_screen', 'interview'].includes(app.status)).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Active</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                    {stats.total_applications > 0 ? Math.round((stats.interviews_plus / stats.total_applications) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Interview Rate</div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Response Time Analysis" icon={Clock}>
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                Response time analysis would go here
              </div>
            </InfoCard>

            <InfoCard title="Salary Insights" icon={DollarSign}>
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                Salary comparison charts would go here
              </div>
            </InfoCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetail;
