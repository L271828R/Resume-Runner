import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Plus, FileText, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
import ResumeVersionForm from '../components/ResumeVersionForm';
import ResumeViewer from '../components/ResumeViewer';

const ResumeVersions = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);

  const { data: versions, isLoading: versionsLoading } = useQuery(
    'resume-versions',
    () => fetch('/api/resume-versions').then(res => res.json())
  );

  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'resume-metrics',
    () => fetch('/api/resume-versions/success-metrics').then(res => res.json())
  );

  if (versionsLoading || metricsLoading) {
    return <div>Loading resume versions...</div>;
  }

  const resumeVersions = versions?.resume_versions || [];
  const successMetrics = metrics?.success_metrics || [];

  const getMetricsForVersion = (versionId) => {
    return successMetrics.find(metric => metric.id === versionId) || {
      total_applications: 0,
      interviews: 0,
      offers: 0,
      interview_rate: 0
    };
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 30) return '#10b981'; // Green
    if (rate >= 15) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const handleViewResume = (version) => {
    setViewingVersion(version);
  };

  const handleEditResume = (version) => {
    setEditingVersion(version);
    setShowForm(true);
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
            Resume Versions
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            Manage your resume versions and track their performance
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Add Resume Version
        </button>
      </div>

      {resumeVersions.length > 0 ? (
        <div className="grid" style={{ gap: '24px' }}>
          {resumeVersions.map((version) => {
            const versionMetrics = getMetricsForVersion(version.id);
            const performanceColor = getPerformanceColor(versionMetrics.interview_rate);

            return (
              <div key={version.id} className="card">
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
                        {version.version_name}
                      </h3>
                      {version.is_master && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          MASTER
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        Target Roles: {version.target_roles || 'Not specified'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Created: {format(new Date(version.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {version.description && (
                      <p style={{
                        margin: '0 0 12px 0',
                        color: '#374151',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {version.description}
                      </p>
                    )}

                    {version.skills_emphasized && version.skills_emphasized.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          Skills Emphasized:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {version.skills_emphasized.map((skill, index) => (
                            <span
                              key={index}
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '4px 8px',
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

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px'
                  }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px' }}
                      onClick={() => handleViewResume(version)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px' }}
                      onClick={() => handleEditResume(version)}
                    >
                      <FileText size={14} />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
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
                    <TrendingUp size={16} style={{ color: performanceColor }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Performance Metrics
                    </span>
                  </div>

                  <div className="grid grid-4" style={{ gap: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {versionMetrics.total_applications}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Applications
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        {versionMetrics.interviews}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Interviews
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#f59e0b'
                      }}>
                        {versionMetrics.offers}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Offers
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: performanceColor
                      }}>
                        {versionMetrics.interview_rate || 0}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Success Rate
                      </div>
                    </div>
                  </div>

                  {versionMetrics.total_applications > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <strong>AI Insight:</strong> {
                        versionMetrics.interview_rate >= 30
                          ? 'This resume version is performing excellently! Consider using it as a template.'
                          : versionMetrics.interview_rate >= 15
                          ? 'This resume version has decent performance. Consider minor optimizations.'
                          : versionMetrics.total_applications >= 5
                          ? 'This resume version may need significant improvements to increase interview rates.'
                          : 'Not enough data yet to provide meaningful insights.'
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '64px 32px'
          }}>
            <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              No resume versions yet
            </h3>
            <p style={{ margin: '0 0 16px 0' }}>
              Start by adding your first resume version to track its performance across applications
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Your First Resume Version
            </button>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {resumeVersions.length > 1 && (
        <div className="card" style={{ marginTop: '32px' }}>
          <h2 style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Performance Comparison
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Resume Version</th>
                  <th>Applications</th>
                  <th>Interviews</th>
                  <th>Offers</th>
                  <th>Success Rate</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {resumeVersions.map((version) => {
                  const metrics = getMetricsForVersion(version.id);
                  const performanceColor = getPerformanceColor(metrics.interview_rate);

                  return (
                    <tr key={version.id}>
                      <td>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {version.version_name}
                        </div>
                        {version.is_master && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            MASTER
                          </span>
                        )}
                      </td>
                      <td>{metrics.total_applications}</td>
                      <td>{metrics.interviews}</td>
                      <td>{metrics.offers}</td>
                      <td>
                        <span style={{ color: performanceColor, fontWeight: '600' }}>
                          {metrics.interview_rate || 0}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '12px',
                          color: performanceColor,
                          fontWeight: '500'
                        }}>
                          {metrics.interview_rate >= 30
                            ? 'Excellent'
                            : metrics.interview_rate >= 15
                            ? 'Good'
                            : metrics.total_applications >= 5
                            ? 'Needs work'
                            : 'More data needed'
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ResumeVersionForm
          version={editingVersion}
          onClose={() => {
            setShowForm(false);
            setEditingVersion(null);
          }}
        />
      )}

      {viewingVersion && (
        <ResumeViewer
          version={viewingVersion}
          onClose={() => setViewingVersion(null)}
        />
      )}
    </div>
  );
};

export default ResumeVersions;