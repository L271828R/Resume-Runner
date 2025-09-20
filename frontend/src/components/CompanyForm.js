import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const defaultFormState = {
  name: '',
  website: '',
  linkedin_url: '',
  industry: '',
  company_size: '',
  headquarters: '',
  is_remote_friendly: false,
  notes: ''
};

const CompanyForm = ({ isOpen, onClose, onSubmit, company = null }) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        website: company.website || '',
        linkedin_url: company.linkedin_url || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
        headquarters: company.headquarters || '',
        is_remote_friendly: Boolean(company.is_remote_friendly),
        notes: company.notes || ''
      });
    } else {
      setFormData(defaultFormState);
    }
    setErrorMessage(null);
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        ...formData,
        is_remote_friendly: Boolean(formData.is_remote_friendly)
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save company');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>{company ? 'Edit Company' : 'Add Company'}</h2>
          <button onClick={onClose} style={styles.iconButton} aria-label="Close company form">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div style={styles.errorBanner}>
              {errorMessage}
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Company Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Stripe"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://company.com"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>LinkedIn URL</label>
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://www.linkedin.com/company/example"
              style={styles.input}
            />
          </div>

          <div style={styles.twoColumn}>
            <div style={styles.column}>
              <label style={styles.label}>Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Fintech, Cloud Computing"
                style={styles.input}
              />
            </div>
            <div style={styles.column}>
              <label style={styles.label}>Company Size</label>
              <input
                type="text"
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                placeholder="e.g., Medium (1000-5000)"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Headquarters</label>
            <input
              type="text"
              name="headquarters"
              value={formData.headquarters}
              onChange={handleChange}
              placeholder="City, State/Province"
              style={styles.input}
            />
          </div>

          <label style={{ ...styles.label, ...styles.checkboxLabel }}>
            <input
              type="checkbox"
              name="is_remote_friendly"
              checked={formData.is_remote_friendly}
              onChange={handleChange}
              style={{ margin: 0 }}
            />
            Remote friendly company
          </label>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any hiring insights, recruiter contacts, etc."
              rows={4}
              style={styles.textarea}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.secondaryButton} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.name.trim()}
              style={{ opacity: isSubmitting || !formData.name.trim() ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Saving...' : company ? 'Save Changes' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.15)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 600,
    color: '#1f2937'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#6b7280'
  },
  fieldGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px'
  },
  required: {
    color: '#ef4444',
    fontWeight: 600
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical'
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  column: {
    display: 'flex',
    flexDirection: 'column'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  secondaryButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: 'white',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  errorBanner: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
    fontSize: '13px'
  }
};

export default CompanyForm;
