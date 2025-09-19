import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { X, User, Building2, Mail, Phone, Linkedin, MapPin, Users, Shield, Clock, Plus, Trash2, Edit3 } from 'lucide-react';

const RecruiterForm = ({ recruiter, onClose }) => {
  const [formData, setFormData] = useState({
    name: recruiter?.name || '',
    primary_contact_name: recruiter?.primary_contact_name || '',
    email: recruiter?.email || '',
    phone: recruiter?.phone || '',
    phone_secondary: recruiter?.phone_secondary || '',
    company: recruiter?.company || '',
    linkedin_url: recruiter?.linkedin_url || '',
    specialties: recruiter?.specialties || '',
    position_title: recruiter?.position_title || '',
    department: recruiter?.department || '',
    manager_name: recruiter?.manager_name || '',
    manager_email: recruiter?.manager_email || '',
    manager_phone: recruiter?.manager_phone || '',
    manager_linkedin_url: recruiter?.manager_linkedin_url || '',
    account_name: recruiter?.account_name || '',
    account_type: recruiter?.account_type || '',
    office_location: recruiter?.office_location || '',
    timezone: recruiter?.timezone || '',
    preferred_contact_method: recruiter?.preferred_contact_method || 'email',
    is_manager: recruiter?.is_manager || false,
    team_size: recruiter?.team_size || '',
    decision_authority: recruiter?.decision_authority || '',
    relationship_status: recruiter?.relationship_status || 'new',
    notes: recruiter?.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newManagerData, setNewManagerData] = useState({
    name: '', email: '', phone: '', position_title: '', company_id: '',
    relationship_type: 'works_with', relationship_notes: '', is_primary_contact: false
  });
  const [newCompanyData, setNewCompanyData] = useState({
    company_id: '', association_type: 'external', specialization: '', notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch available companies for dropdowns
  const { data: availableCompanies } = useQuery(
    'companies',
    () => fetch('/api/companies').then(res => res.json())
  );

  // Fetch available managers
  const { data: availableManagers } = useQuery(
    'managers',
    () => fetch('/api/managers').then(res => res.json())
  );

  // Fetch recruiter's current managers and companies if editing
  useEffect(() => {
    if (recruiter?.id) {
      // Fetch current managers
      fetch(`/api/recruiters/${recruiter.id}/managers`)
        .then(res => res.json())
        .then(data => {
          if (data.managers) {
            setManagers(data.managers);
          }
        })
        .catch(console.error);

      // Fetch current companies
      fetch(`/api/recruiters/${recruiter.id}/companies`)
        .then(res => res.json())
        .then(data => {
          if (data.companies) {
            setCompanies(data.companies);
          }
        })
        .catch(console.error);
    }
  }, [recruiter?.id]);

  const createMutation = useMutation(
    async (data) => {
      const url = recruiter ? `/api/recruiters/${recruiter.id}` : '/api/recruiters';
      const method = recruiter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(recruiter ? 'Failed to update recruiter' : 'Failed to create recruiter');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recruiters');
        queryClient.invalidateQueries('recruiter-dashboard');
        onClose();
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving recruiter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddManager = async () => {
    if (!recruiter?.id) {
      alert('Please save the recruiter first before adding managers');
      return;
    }

    try {
      // If creating a new manager
      if (newManagerData.name && !newManagerData.manager_id) {
        const managerResponse = await fetch('/api/managers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newManagerData.name,
            email: newManagerData.email,
            phone: newManagerData.phone,
            position_title: newManagerData.position_title,
            company_id: newManagerData.company_id || null,
            notes: newManagerData.relationship_notes
          })
        });

        if (!managerResponse.ok) throw new Error('Failed to create manager');
        const managerResult = await managerResponse.json();
        newManagerData.manager_id = managerResult.manager.id;
      }

      // Create relationship
      const relationshipResponse = await fetch(`/api/recruiters/${recruiter.id}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: newManagerData.manager_id,
          relationship_type: newManagerData.relationship_type,
          relationship_notes: newManagerData.relationship_notes,
          is_primary_contact: newManagerData.is_primary_contact
        })
      });

      if (!relationshipResponse.ok) throw new Error('Failed to create relationship');

      // Refresh managers list
      const managersResponse = await fetch(`/api/recruiters/${recruiter.id}/managers`);
      const managersData = await managersResponse.json();
      setManagers(managersData.managers || []);

      // Reset form
      setNewManagerData({
        name: '', email: '', phone: '', position_title: '', company_id: '',
        relationship_type: 'works_with', relationship_notes: '', is_primary_contact: false
      });
      setShowAddManager(false);
    } catch (error) {
      console.error('Error adding manager:', error);
      alert('Failed to add manager: ' + error.message);
    }
  };

  const handleAddCompany = async () => {
    if (!recruiter?.id) {
      alert('Please save the recruiter first before adding company associations');
      return;
    }

    try {
      const response = await fetch(`/api/companies/${newCompanyData.company_id}/recruiters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiter_id: recruiter.id,
          association_type: newCompanyData.association_type,
          specialization: newCompanyData.specialization,
          notes: newCompanyData.notes
        })
      });

      if (!response.ok) throw new Error('Failed to create company association');

      // Refresh companies list
      const companiesResponse = await fetch(`/api/recruiters/${recruiter.id}/companies`);
      const companiesData = await companiesResponse.json();
      setCompanies(companiesData.companies || []);

      // Reset form
      setNewCompanyData({
        company_id: '', association_type: 'external', specialization: '', notes: ''
      });
      setShowAddCompany(false);
    } catch (error) {
      console.error('Error adding company:', error);
      alert('Failed to add company association: ' + error.message);
    }
  };

  const handleRemoveManager = async (managerId) => {
    if (!recruiter?.id) return;

    try {
      const response = await fetch(`/api/recruiters/${recruiter.id}/managers/${managerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove manager relationship');

      // Refresh managers list
      const managersResponse = await fetch(`/api/recruiters/${recruiter.id}/managers`);
      const managersData = await managersResponse.json();
      setManagers(managersData.managers || []);
    } catch (error) {
      console.error('Error removing manager:', error);
      alert('Failed to remove manager relationship: ' + error.message);
    }
  };

  const handleRemoveCompany = async (companyId) => {
    if (!recruiter?.id) return;

    try {
      const response = await fetch(`/api/companies/${companyId}/recruiters/${recruiter.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove company association');

      // Refresh companies list
      const companiesResponse = await fetch(`/api/recruiters/${recruiter.id}/companies`);
      const companiesData = await companiesResponse.json();
      setCompanies(companiesData.companies || []);
    } catch (error) {
      console.error('Error removing company:', error);
      alert('Failed to remove company association: ' + error.message);
    }
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
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
            {recruiter ? 'Edit Recruiter' : 'Add Recruiter'}
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
          {/* Basic Information Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Recruiter / Agency Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., BigYelloStaffing"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  name="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Jane Smith"
                  className="form-input"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <Building2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Company name"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Position Title
                </label>
                <input
                  type="text"
                  name="position_title"
                  value={formData.position_title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Technical Recruiter"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Talent Acquisition"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="recruiter@company.com"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <Phone size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Primary Contact Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className="form-input"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Secondary Contact Phone
                </label>
                <input
                  type="tel"
                  name="phone_secondary"
                  value={formData.phone_secondary}
                  onChange={handleInputChange}
                  placeholder="(555) 987-6543"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Preferred Contact Method
                </label>
                <select
                  name="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="text">Text Message</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                <Linkedin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/recruiter-name"
                className="form-input"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Office Location
                </label>
                <input
                  type="text"
                  name="office_location"
                  value={formData.office_location}
                  onChange={handleInputChange}
                  placeholder="e.g., San Francisco, CA"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select timezone</option>
                  <option value="PST">PST (Pacific)</option>
                  <option value="MST">MST (Mountain)</option>
                  <option value="CST">CST (Central)</option>
                  <option value="EST">EST (Eastern)</option>
                  <option value="GMT">GMT (London)</option>
                  <option value="CET">CET (Central Europe)</option>
                  <option value="IST">IST (India)</option>
                  <option value="JST">JST (Japan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Manager Information Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              <Users size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Manager Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Manager Name
                </label>
                <input
                  type="text"
                  name="manager_name"
                  value={formData.manager_name}
                  onChange={handleInputChange}
                  placeholder="Manager's full name"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Manager Email
                </label>
                <input
                  type="email"
                  name="manager_email"
                  value={formData.manager_email}
                  onChange={handleInputChange}
                  placeholder="manager@company.com"
                  className="form-input"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Manager Phone
                </label>
                <input
                  type="tel"
                  name="manager_phone"
                  value={formData.manager_phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Manager LinkedIn
                </label>
                <input
                  type="url"
                  name="manager_linkedin_url"
                  value={formData.manager_linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/manager"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Account & Authority Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              <Shield size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Account & Authority
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Account Name
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Netflix Engineering"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Account Type
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select type</option>
                  <option value="Client Account">Client Account</option>
                  <option value="Internal Team">Internal Team</option>
                  <option value="Strategic Partner">Strategic Partner</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Decision Authority
                </label>
                <select
                  name="decision_authority"
                  value={formData.decision_authority}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select authority level</option>
                  <option value="Screening Only">Screening Only</option>
                  <option value="Screening and Initial Interview">Screening and Initial Interview</option>
                  <option value="Technical Screening">Technical Screening</option>
                  <option value="Final Hiring Decision">Final Hiring Decision</option>
                  <option value="Budget Authority">Budget Authority</option>
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Relationship Status
                </label>
                <select
                  name="relationship_status"
                  value={formData.relationship_status}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="new">New Contact</option>
                  <option value="active">Active Relationship</option>
                  <option value="cold">Cold Contact</option>
                  <option value="blocked">Do Not Contact</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  <input
                    type="checkbox"
                    name="is_manager"
                    checked={formData.is_manager}
                    onChange={handleInputChange}
                    style={{ marginRight: '8px' }}
                  />
                  Is a Manager
                </label>
              </div>
              {formData.is_manager && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Team Size
                  </label>
                  <input
                    type="number"
                    name="team_size"
                    value={formData.team_size}
                    onChange={handleInputChange}
                    placeholder="Number of direct reports"
                    className="form-input"
                    min="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Professional Details Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Professional Details
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Specialties
              </label>
              <input
                type="text"
                name="specialties"
                value={formData.specialties}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineering, Data Science, Product Management"
                className="form-input"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes about this recruiter..."
                rows={4}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Manager Relationships Section */}
          {recruiter?.id && (
            <div style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  <Users size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Manager Relationships ({managers.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddManager(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} style={{ marginRight: '4px' }} />
                  Add Manager
                </button>
              </div>

              {managers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {managers.map((manager) => (
                    <div key={manager.id} style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <strong style={{ color: '#1f2937' }}>{manager.manager_name}</strong>
                            {manager.is_primary_contact && (
                              <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                Primary
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            {manager.manager_position} • {manager.company_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                            {manager.relationship_type.replace('_', ' ')} • {manager.manager_email}
                          </div>
                          {manager.relationship_notes && (
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                              "{manager.relationship_notes}"
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveManager(manager.manager_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '24px',
                  fontSize: '14px'
                }}>
                  No manager relationships yet. Add managers to track contacts at client companies.
                </div>
              )}

              {/* Add Manager Form */}
              {showAddManager && (
                <div style={{
                  marginTop: '16px',
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid #dcfce7'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    Add Manager Relationship
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Select Existing Manager
                      </label>
                      <select
                        value={newManagerData.manager_id || ''}
                        onChange={(e) => setNewManagerData(prev => ({
                          ...prev,
                          manager_id: e.target.value,
                          name: '', email: '', phone: '', position_title: ''
                        }))}
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="">Select a manager...</option>
                        {availableManagers?.managers?.map(mgr => (
                          <option key={mgr.id} value={mgr.id}>
                            {mgr.name} - {mgr.position_title} ({mgr.company_name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Relationship Type
                      </label>
                      <select
                        value={newManagerData.relationship_type}
                        onChange={(e) => setNewManagerData(prev => ({ ...prev, relationship_type: e.target.value }))}
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="works_with">Works With</option>
                        <option value="reports_to">Reports To</option>
                        <option value="introduced_by">Introduced By</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Or Create New Manager Name
                      </label>
                      <input
                        type="text"
                        value={newManagerData.name}
                        onChange={(e) => setNewManagerData(prev => ({ ...prev, name: e.target.value, manager_id: '' }))}
                        placeholder="Manager's full name"
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={newManagerData.email}
                        onChange={(e) => setNewManagerData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="manager@company.com"
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Relationship Notes
                    </label>
                    <textarea
                      value={newManagerData.relationship_notes}
                      onChange={(e) => setNewManagerData(prev => ({ ...prev, relationship_notes: e.target.value }))}
                      placeholder="Notes about this relationship..."
                      rows={2}
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      <input
                        type="checkbox"
                        checked={newManagerData.is_primary_contact}
                        onChange={(e) => setNewManagerData(prev => ({ ...prev, is_primary_contact: e.target.checked }))}
                        style={{ marginRight: '6px' }}
                      />
                      Primary Contact
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleAddManager}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Add Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddManager(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company Associations Section */}
          {recruiter?.id && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  <Building2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Company Associations ({companies.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCompany(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} style={{ marginRight: '4px' }} />
                  Add Company
                </button>
              </div>

              {companies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {companies.map((company) => (
                    <div key={company.id} style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <strong style={{ color: '#1f2937' }}>{company.company_name}</strong>
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {company.association_type}
                            </span>
                          </div>
                          {company.specialization && (
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                              Specialization: {company.specialization}
                            </div>
                          )}
                          {company.notes && (
                            <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                              "{company.notes}"
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(company.company_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '24px',
                  fontSize: '14px'
                }}>
                  No company associations yet. Add companies to track specializations.
                </div>
              )}

              {/* Add Company Form */}
              {showAddCompany && (
                <div style={{
                  marginTop: '16px',
                  background: '#fef3c7',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                    Add Company Association
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Company
                      </label>
                      <select
                        value={newCompanyData.company_id}
                        onChange={(e) => setNewCompanyData(prev => ({ ...prev, company_id: e.target.value }))}
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="">Select a company...</option>
                        {availableCompanies?.companies?.map(comp => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Association Type
                      </label>
                      <select
                        value={newCompanyData.association_type}
                        onChange={(e) => setNewCompanyData(prev => ({ ...prev, association_type: e.target.value }))}
                        className="form-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="external">External Recruiter</option>
                        <option value="internal">Internal Recruiter</option>
                        <option value="contractor">Contractor</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={newCompanyData.specialization}
                      onChange={(e) => setNewCompanyData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g., Senior Engineering Roles, Data Science"
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Notes
                    </label>
                    <textarea
                      value={newCompanyData.notes}
                      onChange={(e) => setNewCompanyData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes about this association..."
                      rows={2}
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Add Company
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={isSubmitting || !formData.name}
              className="btn btn-primary"
              style={{
                opacity: isSubmitting || !formData.name ? 0.5 : 1
              }}
            >
              {isSubmitting
                ? (recruiter ? 'Updating...' : 'Creating...')
                : (recruiter ? 'Update Recruiter' : 'Create Recruiter')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterForm;
