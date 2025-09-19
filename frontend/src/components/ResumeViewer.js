import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ResumeViewer = ({ version, onClose }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (version?.s3_key) {
      fetchDownloadUrl();
    }
  }, [version]);

  const fetchDownloadUrl = async () => {
    console.log('🔍 [DEBUG] fetchDownloadUrl called');
    console.log('🔍 [DEBUG] version object:', version);
    console.log('🔍 [DEBUG] s3_key:', version?.s3_key);

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        s3_key: version.s3_key,
        expires_in: 3600 // 1 hour
      };

      console.log('🔍 [DEBUG] Request body:', requestBody);

      const response = await fetch('/api/files/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ [ERROR] Response error text:', errorText);
        throw new Error(`Failed to generate download URL: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [DEBUG] Response data:', data);

      setDownloadUrl(data.download_url);
      console.log('🔍 [DEBUG] Download URL set:', data.download_url);
    } catch (err) {
      console.log('❌ [ERROR] Error in fetchDownloadUrl:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = version.filename || `${version.version_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const isPDF = version?.filename?.toLowerCase().endsWith('.pdf') ||
                version?.s3_key?.toLowerCase().includes('.pdf');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '100%',
        height: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              {version.version_name}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Created: {format(new Date(version.created_at), 'MMM d, yyyy')}
              {version.filename && ` • ${version.filename}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {downloadUrl && (
              <>
                <button
                  onClick={handleDownload}
                  className="btn btn-secondary"
                  style={{ fontSize: '14px' }}
                >
                  <Download size={16} />
                  Download
                </button>
                {isPDF && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="btn btn-secondary"
                    style={{ fontSize: '14px' }}
                  >
                    <ExternalLink size={16} />
                    Open in New Tab
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {isLoading && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div className="resume-spinner" />
              <p style={{ color: '#6b7280', margin: 0 }}>Loading resume...</p>
            </div>
          )}

          {error && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              padding: '40px'
            }}>
              <AlertCircle size={48} style={{ color: '#ef4444' }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                  Unable to load resume
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                  {error}
                </p>
                <button
                  onClick={fetchDownloadUrl}
                  className="btn btn-primary"
                  style={{ fontSize: '14px' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!version.s3_key && !isLoading && !error && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <FileText size={48} style={{ color: '#d1d5db' }} />
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                  No file uploaded
                </h3>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  This resume version doesn't have an associated file yet.
                </p>
              </div>

              {/* Resume Details */}
              <div style={{
                marginTop: '24px',
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                maxWidth: '500px',
                width: '100%'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Resume Details
                </h4>

                {version.description && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151', fontSize: '14px' }}>Description:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {version.description}
                    </p>
                  </div>
                )}

                {version.target_roles && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151', fontSize: '14px' }}>Target Roles:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {version.target_roles}
                    </p>
                  </div>
                )}

                {version.skills_emphasized && version.skills_emphasized.length > 0 && (
                  <div>
                    <strong style={{ color: '#374151', fontSize: '14px' }}>Skills Emphasized:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
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
            </div>
          )}

          {downloadUrl && isPDF && !error && (
            <div style={{ flex: 1, padding: '16px' }}>
              <iframe
                src={downloadUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '4px'
                }}
                title={`Resume: ${version.version_name}`}
              />
            </div>
          )}

          {downloadUrl && !isPDF && !error && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              padding: '40px'
            }}>
              <FileText size={48} style={{ color: '#3b82f6' }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                  Resume file ready
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                  Click Download to view this {version.filename?.split('.').pop()?.toUpperCase()} file
                </p>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary"
                >
                  <Download size={16} />
                  Download Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ResumeViewer;
