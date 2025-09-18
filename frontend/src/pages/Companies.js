import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Building2,
  Search,
  ExternalLink,
  TrendingUp,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Briefcase,
  Target,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery(
    'companies',
    () => fetch('/api/companies').then(res => res.json())
  );

  if (isLoading) return <div>Loading companies...</div>;
  if (error) return <div>Error loading companies</div>;

  const companies = data?.companies || [];

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getHiringFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'frequent': return '#10b981';
      case 'occasional': return '#f59e0b';
      case 'rare': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCompanySizeColor = (size) => {
    if (!size) return '#6b7280';
    if (size.includes('10000+')) return '#8b5cf6';
    if (size.includes('1000')) return '#3b82f6';
    if (size.includes('100')) return '#10b981';
    return '#6b7280';
  };

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
            Companies
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            Track company hiring patterns and build your target list
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Add Company
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
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
            placeholder="Search companies or industries..."
            className="form-input"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {filteredCompanies.map((company) => (
            <div key={company.id} className="card">
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
                      {company.name}
                    </h3>
                    {company.is_remote_friendly && (
                      <span style={{
                        background: '#dcfce7',
                        color: '#16a34a',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Remote Friendly
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginBottom: '12px'
                  }}>
                    {company.industry && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {company.industry}
                        </span>
                      </div>
                    )}

                    {company.company_size && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} style={{ color: '#6b7280' }} />
                        <span style={{
                          fontSize: '14px',
                          color: getCompanySizeColor(company.company_size),
                          fontWeight: '500'
                        }}>
                          {company.company_size}
                        </span>
                      </div>
                    )}

                    {company.headquarters && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {company.headquarters}
                        </span>
                      </div>
                    )}
                  </div>

                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      Visit Website <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Company Activity Stats */}
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <TrendingUp size={16} style={{ color: '#6b7280' }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Hiring Activity
                  </span>
                </div>

                <div className="grid grid-3" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1f2937'
                    }}>
                      {company.total_jobs_posted || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Jobs Posted
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#3b82f6'
                    }}>
                      {company.applications_sent || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Applications
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: company.applications_sent > 0
                        ? (company.applications_sent >= 3 ? '#10b981' : '#f59e0b')
                        : '#6b7280'
                    }}>
                      {company.applications_sent > 0
                        ? Math.round((1 / company.applications_sent) * 100) + '%'
                        : '-'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      Est. Rate
                    </div>
                  </div>
                </div>

                {company.avg_salary_min && company.avg_salary_max && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <DollarSign size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      ${Math.round(company.avg_salary_min / 1000)}k - ${Math.round(company.avg_salary_max / 1000)}k avg
                    </span>
                  </div>
                )}

                {company.last_job_posted && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Calendar size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Last job: {format(new Date(company.last_job_posted), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {company.remote_jobs > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MapPin size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                      {company.remote_jobs} remote position{company.remote_jobs !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {!company.total_jobs_posted && !company.applications_sent && (
                  <div style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    No activity tracked yet
                  </div>
                )}
              </div>

              {/* Application Status Indicators */}
              {company.applications_sent > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <Clock size={12} style={{ color: '#f59e0b' }} />
                    <span>In Progress</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <CheckCircle size={12} style={{ color: '#10b981' }} />
                    <span>Interview</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <XCircle size={12} style={{ color: '#ef4444' }} />
                    <span>Rejected</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px'
              }}>
                <Link
                  to={`/companies/${company.id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}
                >
                  <Eye size={12} style={{ marginRight: '4px' }} />
                  View Details
                </Link>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: '12px' }}>
                  <Target size={12} style={{ marginRight: '4px' }} />
                  Apply Now
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
            <Building2 size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {searchTerm ? 'No matching companies' : 'No companies tracked yet'}
            </h3>
            <p style={{ margin: '0 0 16px 0' }}>
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Start building your target company list to track their hiring patterns'
              }
            </p>
            {!searchTerm && (
              <button className="btn btn-primary">
                <Plus size={16} />
                Add Your First Company
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredCompanies.length > 0 && !searchTerm && (
        <div className="card" style={{ marginTop: '32px' }}>
          <h2 style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Company Intelligence Summary
          </h2>
          <div className="grid grid-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
                {companies.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Companies Tracked
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                {companies.filter(c => c.is_remote_friendly).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Remote Friendly
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
                {companies.reduce((sum, c) => sum + (c.total_jobs_posted || 0), 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total Jobs Posted
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                {companies.reduce((sum, c) => sum + (c.applications_sent || 0), 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Applications Sent
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;