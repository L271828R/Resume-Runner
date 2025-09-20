import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { X, Plus, Tag } from 'lucide-react';

const TagSelector = ({ selectedTags = [], onTagsChange, className = '' }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Fetch available tags
  const { data: tagsData, isLoading: tagsLoading, refetch: refetchTags } = useQuery(
    'tags',
    () => fetch('/api/tags').then(res => res.json())
  );

  const availableTags = tagsData?.tags || [];

  // Get selected tag objects
  const selectedTagObjects = availableTags.filter(tag =>
    selectedTags.includes(tag.id)
  );

  const handleTagToggle = (tagId) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    onTagsChange(newSelectedTags);
  };

  const handleCreateTag = async (e) => {
    if (e) e.preventDefault();

    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          description: newTagDescription.trim() || null,
          color: newTagColor
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create tag');
        return;
      }

      const result = await response.json();

      // Add the new tag to selected tags
      onTagsChange([...selectedTags, result.tag.id]);

      // Refresh tags list
      await refetchTags();

      // Reset form
      setNewTagName('');
      setNewTagDescription('');
      setNewTagColor('#3B82F6');
      setShowCreateForm(false);

    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    }
  };

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6B7280', // Gray
  ];

  if (tagsLoading) {
    return <div>Loading tags...</div>;
  }

  return (
    <div className={className}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
      }}>
        Tags
      </label>

      {/* Selected Tags Display */}
      {selectedTagObjects.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '12px'
        }}>
          {selectedTagObjects.map((tag) => (
            <span
              key={tag.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: tag.color,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Tags */}
      <div style={{
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '12px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Available Tags:
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '12px'
        }}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                style={{
                  background: isSelected ? tag.color : 'white',
                  color: isSelected ? 'white' : tag.color,
                  border: `1px solid ${tag.color}`,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.8
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        {/* Create New Tag Button */}
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px dashed #9ca3af',
              color: '#6b7280',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <Plus size={12} />
            Create New Tag
          </button>
        ) : (
          /* Create New Tag Form */
          <div style={{
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '12px',
            backgroundColor: 'white'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <Tag size={14} style={{ color: '#6b7280' }} />
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Create New Tag
              </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name (e.g., MorePython)"
                required
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                Color:
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px'
              }}>
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: color,
                      border: newTagColor === color ? '2px solid #1f2937' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={handleCreateTag}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTagName('');
                  setNewTagDescription('');
                  setNewTagColor('#3B82F6');
                }}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: 'none',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{
        fontSize: '12px',
        color: '#6b7280',
        margin: '4px 0 0 0'
      }}>
        Use tags to categorize your resume versions (e.g., MorePython, Management, Condensed)
      </p>
    </div>
  );
};

export default TagSelector;