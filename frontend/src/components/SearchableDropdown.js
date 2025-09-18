import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  required = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className={className} ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          minHeight: '38px'
        }}
      >
        <span style={{
          color: selectedOption ? '#1f2937' : '#9ca3af',
          flex: 1
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: '#6b7280',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          marginTop: '2px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxHeight: '200px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '8px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '8px',
                color: '#6b7280'
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: '6px 6px 6px 32px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>
          </div>

          <div style={{
            maxHeight: '160px',
            overflowY: 'auto'
          }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    backgroundColor: value === option.value ? '#f3f4f6' : 'white',
                    color: '#1f2937',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.value) {
                      e.target.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.value) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;