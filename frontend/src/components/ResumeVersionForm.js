import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { X, Upload, FileText } from 'lucide-react';
import TagSelector from './TagSelector';

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const ResumeVersionForm = ({ version, onClose }) => {
  const [formData, setFormData] = useState({
    version_name: version?.version_name || '',
    description: version?.description || '',
    target_roles: version?.target_roles || '',
    skills_emphasized: version?.skills_emphasized ? version.skills_emphasized.join(', ') : '',
    is_master: normalizeBoolean(version?.is_master)
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedEditableFile, setSelectedEditableFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const queryClient = useQueryClient();

  // Fetch existing tags for the resume version when editing
  const { data: existingTagsData } = useQuery(
    ['resume-tags', version?.id],
    () => version?.id ? fetch(`/api/resume-versions/${version.id}/tags`).then(res => res.json()) : Promise.resolve({ tags: [] }),
    {
      enabled: !!version?.id
    }
  );

  // Load existing tags when editing
  useEffect(() => {
    if (existingTagsData?.tags) {
      setSelectedTags(existingTagsData.tags.map(tag => tag.id));
    }
  }, [existingTagsData]);

  const createMutation = useMutation(
    async (data) => {
      const url = version ? `/api/resume-versions/${version.id}` : '/api/resume-versions';
      const method = version ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(version ? 'Failed to update resume version' : 'Failed to create resume version');
      }

      return response.json();
    },
    {
      onSuccess: async (result) => {
        console.log('🔍 [DEBUG] Resume version update successful, updating tags...');

        // Get the resume version ID (either from editing existing or newly created)
        const resumeVersionId = version?.id || result.resume_version?.id;

        if (resumeVersionId && selectedTags.length >= 0) {
          // Update tags for the resume version
          try {
            const tagsResponse = await fetch(`/api/resume-versions/${resumeVersionId}/tags`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tag_ids: selectedTags }),
            });

            if (!tagsResponse.ok) {
              console.error('Failed to update tags, but resume was saved');
            } else {
              console.log('🔍 [DEBUG] Tags updated successfully');
            }
          } catch (error) {
            console.error('Error updating tags:', error);
          }
        }

        // Invalidate caches
        await queryClient.invalidateQueries('resume-versions');
        await queryClient.invalidateQueries('resume-metrics');
        await queryClient.invalidateQueries('tags');

        // Force a refetch to ensure UI updates immediately
        console.log('🔍 [DEBUG] Forcing refetch of resume versions...');
        await queryClient.refetchQueries('resume-versions');

        console.log('🔍 [DEBUG] Cache invalidation complete, closing form...');
        onClose();
      },
    }
  );

  useEffect(() => {
    setFormData({
      version_name: version?.version_name || '',
      description: version?.description || '',
      target_roles: version?.target_roles || '',
      skills_emphasized: version?.skills_emphasized ? version.skills_emphasized.join(', ') : '',
      is_master: normalizeBoolean(version?.is_master)
    });
  }, [version]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 [DEBUG] Form submit started');
    console.log('🔍 [DEBUG] Selected PDF file:', selectedFile);
    console.log('🔍 [DEBUG] Selected editable file:', selectedEditableFile);
    console.log('🔍 [DEBUG] Form data:', formData);
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        is_master: Boolean(formData.is_master),
        skills_emphasized: formData.skills_emphasized
          ? formData.skills_emphasized.split(',').map(skill => skill.trim())
          : []
      };

      // If files are selected, upload them
      if (selectedFile || selectedEditableFile) {
        console.log('🔍 [DEBUG] Uploading files...');
        if (selectedFile) console.log('  PDF file:', selectedFile.name);
        if (selectedEditableFile) console.log('  Editable file:', selectedEditableFile.name);

        const formDataWithFile = new FormData();
        if (selectedFile) {
          console.log('🔍 [DEBUG] Appending PDF file to FormData');
          formDataWithFile.append('file', selectedFile);
        }
        if (selectedEditableFile) {
          console.log('🔍 [DEBUG] Appending editable file to FormData');
          formDataWithFile.append('editable_file', selectedEditableFile);
        }

        // Add all form data to FormData
        Object.keys(submitData).forEach(key => {
          if (key === 'skills_emphasized') {
            formDataWithFile.append(key, JSON.stringify(submitData[key]));
          } else {
            formDataWithFile.append(key, submitData[key]);
          }
        });

        // Send form data with file - use proper method and URL for updates
        const url = version ? `/api/resume-versions/${version.id}` : '/api/resume-versions';
        const method = version ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          body: formDataWithFile,
        });

        if (!response.ok) {
          throw new Error(version ? 'Failed to update resume version' : 'Failed to upload resume');
        }

        const result = await response.json();
        console.log('🔍 [DEBUG] Upload result:', result);

        // Update tags for the resume version
        const resumeVersionId = version?.id || result.resume_version?.id;
        if (resumeVersionId && selectedTags.length >= 0) {
          try {
            const tagsResponse = await fetch(`/api/resume-versions/${resumeVersionId}/tags`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ tag_ids: selectedTags }),
            });

            if (!tagsResponse.ok) {
              console.error('Failed to update tags, but resume was saved');
            } else {
              console.log('🔍 [DEBUG] Tags updated successfully');
            }
          } catch (error) {
            console.error('Error updating tags:', error);
          }
        }

        // Invalidate queries to refresh data
        console.log('🔍 [DEBUG] File upload successful, invalidating cache...');
        await queryClient.invalidateQueries('resume-versions');
        await queryClient.invalidateQueries('resume-metrics');
        await queryClient.invalidateQueries('tags');

        // Force a refetch to ensure UI updates immediately
        console.log('🔍 [DEBUG] Forcing refetch of resume versions...');
        await queryClient.refetchQueries('resume-versions');

        console.log('🔍 [DEBUG] Cache invalidation complete, closing form...');
        onClose();
      } else {
        // No file, use regular JSON submission
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error('❌ [ERROR] Error creating resume version:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleEditableFileChange = (e) => {
    const file = e.target.files[0];
    console.log('🔍 [DEBUG] Editable file selected:', file);
    console.log('🔍 [DEBUG] File name:', file?.name);
    console.log('🔍 [DEBUG] File type:', file?.type);
    console.log('🔍 [DEBUG] File size:', file?.size);
    setSelectedEditableFile(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {version ? 'Edit Resume Version' : 'Add Resume Version'}
          </h2>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Version Name *
            </label>
            <input
              type="text"
              name="version_name"
              value={formData.version_name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Data Science v2, Backend Engineer v1"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of what makes this version unique"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Target Roles
            </label>
            <input
              type="text"
              name="target_roles"
              value={formData.target_roles}
              onChange={handleInputChange}
              placeholder="e.g., Data Scientist, Backend Engineer, Full Stack Developer"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Skills Emphasized
            </label>
            <input
              type="text"
              name="skills_emphasized"
              value={formData.skills_emphasized}
              onChange={handleInputChange}
              placeholder="Python, React, AWS, Machine Learning (comma-separated)"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Separate skills with commas
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                name="is_master"
                checked={formData.is_master}
                onChange={handleInputChange}
                style={{ margin: 0 }}
              />
              Set as master version
            </label>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 24px'
            }}>
              The master version is your default resume
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              PDF Resume (for viewing)
            </label>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '4px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: selectedFile ? '#f9fafb' : 'white'
            }}>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
                style={{ display: 'none' }}
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
                {selectedFile ? (
                  <div>
                    <FileText size={24} style={{ color: '#dc2626', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#1f2937' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      Click to change PDF file
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ color: '#6b7280', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
                      Upload PDF resume for viewing
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      PDF files only
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Editable Source (for editing)
            </label>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '4px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: selectedEditableFile ? '#f9fafb' : 'white'
            }}>
              <input
                type="file"
                onChange={handleEditableFileChange}
                style={{ display: 'none' }}
                id="editable-upload"
              />
              <label
                htmlFor="editable-upload"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  console.log('🔍 [DEBUG] Editable file label clicked');
                  document.getElementById('editable-upload').click();
                }}
              >
                {selectedEditableFile ? (
                  <div>
                    <FileText size={24} style={{ color: '#2563eb', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#1f2937' }}>
                      {selectedEditableFile.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      Click to change editable file
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ color: '#6b7280', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
                      Upload editable source for editing
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      DOC, DOCX, or Pages files
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.version_name}
              className="btn btn-primary"
              style={{
                opacity: isSubmitting || !formData.version_name ? 0.5 : 1
              }}
            >
              {isSubmitting
                ? (version ? 'Updating...' : 'Creating...')
                : (version ? 'Update Resume Version' : 'Create Resume Version')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResumeVersionForm;
