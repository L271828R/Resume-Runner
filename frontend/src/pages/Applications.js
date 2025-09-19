import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import ApplicationForm from '../components/ApplicationForm';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    'applications',
    () => fetch('/api/applications').then(res => res.json())
  );

  const createApplicationMutation = useMutation(
    async (applicationData) => {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applications');
        setShowApplicationForm(false);
      },
    }
  );

  const handleCreateApplication = (data) => {
    createApplicationMutation.mutate(data);
  };

  if (isLoading) return <div>Loading applications...</div>;
  if (error) return <div>Error loading applications</div>;

  const applications = data?.applications || [];

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

  const getDaysAgo = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];

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
            Applications
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            Track and manage your job applications
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowApplicationForm(true)}
        >
          <Plus size={16} />
          New Application
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
              placeholder="Search companies or positions..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#6b7280' }} />
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

      {/* Applications Table */}
      <div className="card">
        {filteredApplications.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Resume Version</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const remoteValue = app.is_remote;
                  const isRemote = remoteValue === true || remoteValue === 1 || remoteValue === '1';
                  const isOnsite = remoteValue === false || remoteValue === 0 || remoteValue === '0';

                  let workTypeLabel = 'Not specified';
                  let workTypeColor = '#9ca3af';

                  if (isRemote) {
                    workTypeLabel = 'Remote';
                    workTypeColor = '#10b981';
                  } else if (isOnsite) {
                    workTypeLabel = 'On-site';
                    workTypeColor = '#6b7280';
                  }

                  return (
                    <tr
                      key={app.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/applications/${app.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {app.company_name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: workTypeColor,
                          fontWeight: '500',
                          marginTop: '4px'
                        }}>
                          {workTypeLabel}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {app.position_title}
                        </div>
                      {app.job_posting_text && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                        title={app.job_posting_text.substring(0, 500) + '...'}
                        >
                          📄 {app.job_posting_text.substring(0, 80)}...
                        </div>
                      )}
                      {app.salary_min && app.salary_max && (
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          ${app.salary_min.toLocaleString()} - ${app.salary_max.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {app.resume_used}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: '#1f2937' }}>
                        {format(new Date(app.application_date), 'MMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {getDaysAgo(app.application_date)} days ago
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(app.status)}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '64px 32px'
          }}>
            <Briefcase size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {searchTerm || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'}
            </h3>
            <p style={{ margin: 0 }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start tracking your job applications by adding your first application'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => setShowApplicationForm(true)}
              >
                <Plus size={16} />
                Add Your First Application
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredApplications.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="grid grid-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                {filteredApplications.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total Applications
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {filteredApplications.filter(app =>
                  ['phone_screen', 'interview', 'offer'].includes(app.status)
                ).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Interviews
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {filteredApplications.filter(app => app.status === 'offer').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Offers
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {Math.round(
                  (filteredApplications.filter(app =>
                    ['phone_screen', 'interview', 'offer'].includes(app.status)
                  ).length / filteredApplications.length) * 100
                ) || 0}%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Success Rate
              </div>
            </div>
          </div>
        </div>
      )}

      <ApplicationForm
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
        onSubmit={handleCreateApplication}
      />
    </div>
  );
};

export default Applications;
