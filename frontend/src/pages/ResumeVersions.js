import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Plus, FileText, TrendingUp, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import ResumeVersionForm from '../components/ResumeVersionForm';
import ResumeViewer from '../components/ResumeViewer';

const ResumeVersions = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);

  const { data: versions, isLoading: versionsLoading } = useQuery(
    'resume-versions',
    () => fetch('/api/resume-versions/with-tags').then(res => res.json())
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
    console.log('🔍 [DEBUG] handleViewResume called with version:', version);
    console.log('🔍 [DEBUG] Version s3_key:', version?.s3_key);
    console.log('🔍 [DEBUG] Version filename:', version?.filename);
    setViewingVersion(version);
  };

  const handleEditResume = (version) => {
    setEditingVersion(version);
    setShowForm(true);
  };

  const handleViewPDFInNewTab = async (version) => {
    try {
      console.log('🔍 [DEBUG] Opening PDF in new tab for version:', version.version_name);

      const response = await fetch('/api/files/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_key: version.s3_key,
          expires_in: 3600
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();

      // Open PDF in new tab
      window.open(data.download_url, '_blank');
    } catch (error) {
      console.error('Error opening PDF file:', error);
      alert('Failed to open PDF file. Please try again.');
    }
  };

  const handleDownloadPDF = async (version) => {
    try {
      console.log('🔍 [DEBUG] Downloading PDF file for version:', version.version_name);

      const response = await fetch('/api/files/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_key: version.s3_key,
          expires_in: 3600
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = version.filename || `${version.version_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF file:', error);
      alert('Failed to download PDF file. Please try again.');
    }
  };

  const handleDownloadEditable = async (version) => {
    try {
      console.log('🔍 [DEBUG] Downloading editable file for version:', version.version_name);

      const response = await fetch('/api/files/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_key: version.editable_s3_key,
          expires_in: 3600
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = version.editable_filename || `${version.version_name}_editable.pages`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading editable file:', error);
      alert('Failed to download editable file. Please try again.');
    }
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
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        Created: {format(new Date(version.created_at), 'MMM d, yyyy')}
                      </div>

                      {/* File Downloads */}
                      {(version.s3_key || version.editable_s3_key) ? (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Download Files
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {version.s3_key && (
                              <button
                                onClick={() => handleViewPDFInNewTab(version)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  backgroundColor: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                              >
                                <Eye size={12} />
                                PDF
                              </button>
                            )}
                            {version.editable_s3_key && (
                              <button
                                onClick={() => handleDownloadEditable(version)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                              >
                                <Download size={12} />
                                {version.editable_filename?.endsWith('.pages') ? 'Pages' :
                                 version.editable_filename?.endsWith('.docx') ? 'Word' : 'Editable'}
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                            {version.s3_key && `PDF: ${version.filename}`}
                            {version.s3_key && version.editable_s3_key && ' • '}
                            {version.editable_s3_key && `Source: ${version.editable_filename}`}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#fafafa',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>No files uploaded</span>
                        </div>
                      )}
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

                    {version.tags && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          Tags:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {version.tags.split(', ').map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #d1d5db'
                              }}
                            >
                              🏷️ {tag}
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
                    {version.s3_key && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleViewResume(version)}
                      >
                        <Eye size={14} />
                        View PDF
                      </button>
                    )}
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