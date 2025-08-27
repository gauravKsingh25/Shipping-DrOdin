import React, { useState } from 'react';

export default function AdvancedSettings({ 
  providers, 
  states, 
  fixedCharges, 
  onDataUpdate,
  isOpen,
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('providers');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Password protection state
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Hardcoded password
  const ADMIN_PASSWORD = "Odin@odin123";

  // Password verification functions
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsPasswordVerified(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Invalid password. Access denied.');
      setPasswordInput('');
    }
  };

  const handlePasswordClose = () => {
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordVerified(false);
    onClose();
  };

  // Reset password verification when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsPasswordVerified(false);
      setPasswordInput('');
      setPasswordError('');
    }
  }, [isOpen]);

  // Edit mode states
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  const tabs = [
    { id: 'providers', label: 'Service Providers', icon: '🚚', description: 'Manage shipping service providers' },
    { id: 'states', label: 'State Charges', icon: '🗺️', description: 'Manage per-state shipping rates' },
    { id: 'fixed', label: 'Fixed Charges', icon: '💰', description: 'Manage fixed fees and surcharges' },
  ];

  // Data validation schemas
  const dataSchemas = {
    providers: {
      required: ['Provider Name'],
      optional: ['Provider ID', 'description', 'isActive'],
      readOnly: ['Provider ID'], // Provider ID is auto-generated, read-only
      types: {
        'Provider ID': 'number',
        'Provider Name': 'string',
        'description': 'string',
        'isActive': 'boolean'
      }
    },
    states: {
      required: ['State', 'Per Kilo Fee (INR)', 'Fuel Surcharge (%)'],
      optional: ['Provider ID', 'Provider Name'],
      readOnly: ['Provider ID', 'Provider Name'], // Auto-generated/assigned
      types: {
        'Provider ID': 'number',
        'Provider Name': 'string',
        'State': 'string',
        'Per Kilo Fee (INR)': 'number',
        'Fuel Surcharge (%)': 'number'
      }
    },
    fixed: {
      required: ['Docket Charge (INR)', 'COD Charge (INR)', 'Holiday Charge (INR)', 'Outstation Charge (INR)', 'Insurance Charge (%)', 'NGT Green Tax (INR)', 'Kerala North East Handling Charge (INR)'],
      optional: ['Provider ID'],
      readOnly: ['Provider ID'], // Auto-generated
      types: {
        'Provider ID': 'number',
        'Docket Charge (INR)': 'number',
        'COD Charge (INR)': 'number',
        'Holiday Charge (INR)': 'number',
        'Outstation Charge (INR)': 'number',
        'Insurance Charge (%)': 'number',
        'NGT Green Tax (INR)': 'number',
        'Kerala North East Handling Charge (INR)': 'number'
      }
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'providers': return providers || [];
      case 'states': return states || []; // This is actually statewiseCharges from Dashboard
      case 'fixed': return fixedCharges || [];
      default: return [];
    }
  };

  // Helper functions for edit mode
  const startEdit = (rowIndex) => {
    const currentData = getCurrentData();
    const rowData = currentData[rowIndex];
    setEditingRowIndex(rowIndex);
    setEditingData({ ...rowData });
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setEditingData({});
  };

  const saveEdit = async () => {
    const currentData = getCurrentData();
    const originalRow = currentData[editingRowIndex];
    
    try {
      setIsUploading(true);
      setUploadStatus('💾 Saving changes...');
      
      let endpoint = '';
      let payload = {};
      let method = 'PUT';
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/update-row/${originalRow['Provider ID']}`;
          payload = {
            providerName: editingData['Provider Name'],
            description: editingData.description,
            isActive: editingData.isActive
          };
          break;
        case 'states':
          // For statewise charges, we need to use the MongoDB _id field for updates
          const stateId = originalRow._id || originalRow.id;
          if (!stateId) {
            throw new Error('Cannot update statewise charge: Missing ID field');
          }
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/update-row/${stateId}`;
          payload = {
            perKiloFee: parseFloat(editingData['Per Kilo Fee (INR)']) || 0,
            fuelSurcharge: parseFloat(editingData['Fuel Surcharge (%)']) || 0
          };
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/update-row/${originalRow['Provider ID']}`;
          payload = {
            docketCharge: editingData['Docket Charge (INR)'],
            codCharge: editingData['COD Charge (INR)'],
            holidayCharge: editingData['Holiday Charge (INR)'],
            outstationCharge: editingData['Outstation Charge (INR)'],
            insuranceChargePercent: editingData['Insurance Charge (%)'],
            ngtGreenTax: editingData['NGT Green Tax (INR)'],
            keralaHandlingCharge: editingData['Kerala North East Handling Charge (INR)']
          };
          break;
        default:
          throw new Error('Unknown data type');
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local data
        const updatedData = [...currentData];
        updatedData[editingRowIndex] = { ...editingData };
        
        // Update parent component data
        onDataUpdate(activeTab, updatedData);
        
        setUploadStatus('✅ Changes saved successfully!');
        
        // Reset edit state
        cancelEdit();
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus(`❌ Error saving changes: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setEditingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const startCreateRow = () => {
    const schema = dataSchemas[activeTab];
    const defaultRow = {};
    
    // Initialize with empty values based on schema
    [...schema.required, ...schema.optional].forEach(field => {
      if (schema.types[field] === 'number') {
        defaultRow[field] = 0;
      } else if (schema.types[field] === 'boolean') {
        defaultRow[field] = true;
      } else {
        defaultRow[field] = '';
      }
    });

    setNewRowData(defaultRow);
    setShowCreateRow(true);
  };

  const cancelCreateRow = () => {
    setShowCreateRow(false);
    setNewRowData({});
  };

  const saveNewRow = async () => {
    const currentData = getCurrentData();
    
    try {
      setIsUploading(true);
      setUploadStatus('🆕 Creating new row...');
      
      let endpoint = '';
      let payload = {};
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/create-row`;
          payload = {
            // Don't include providerId - let it auto-generate
            providerName: newRowData['Provider Name'],
            description: newRowData.description || '',
            isActive: newRowData.isActive !== undefined ? newRowData.isActive : true
          };
          break;
        case 'states':
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/create-row`;
          payload = {
            // Don't include providerId/providerName - let them auto-generate
            state: newRowData['State'],
            perKiloFee: parseFloat(newRowData['Per Kilo Fee (INR)']) || 0,
            fuelSurcharge: parseFloat(newRowData['Fuel Surcharge (%)']) || 0
          };
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/create-row`;
          payload = {
            // Don't include providerId - let it auto-generate
            docketCharge: parseFloat(newRowData['Docket Charge (INR)']) || 0,
            codCharge: parseFloat(newRowData['COD Charge (INR)']) || 0,
            holidayCharge: parseFloat(newRowData['Holiday Charge (INR)']) || 0,
            outstationCharge: parseFloat(newRowData['Outstation Charge (INR)']) || 0,
            insuranceChargePercent: parseFloat(newRowData['Insurance Charge (%)']) || 0,
            ngtGreenTax: parseFloat(newRowData['NGT Green Tax (INR)']) || 0,
            keralaHandlingCharge: parseFloat(newRowData['Kerala North East Handling Charge (INR)']) || 0
          };
          break;
        default:
          throw new Error('Unknown data type');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Add to local data
        const updatedData = [...currentData, { ...newRowData }];
        
        // Update parent component data
        onDataUpdate(activeTab, updatedData);
        
        setUploadStatus('✅ New row created successfully!');
        
        // Reset create state
        cancelCreateRow();
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to create new row');
      }
      
    } catch (error) {
      console.error('Create error:', error);
      setUploadStatus(`❌ Error creating new row: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRow = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
      return;
    }
    
    const currentData = getCurrentData();
    const rowToDelete = currentData[rowIndex];
    
    try {
      setIsUploading(true);
      setUploadStatus('🗑️ Deleting row...');
      
      let endpoint = '';
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/delete-row/${rowToDelete['Provider ID']}`;
          break;
        case 'states':
          // For statewise charges, we need to use the MongoDB _id field for deletes
          const stateDeleteId = rowToDelete._id || rowToDelete.id;
          if (!stateDeleteId) {
            throw new Error('Cannot delete statewise charge: Missing ID field');
          }
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/delete-row/${stateDeleteId}`;
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/delete-row/${rowToDelete['Provider ID']}`;
          break;
        default:
          throw new Error('Unknown data type');
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local data
        const updatedData = currentData.filter((_, index) => index !== rowIndex);
        
        // Update parent component data
        onDataUpdate(activeTab, updatedData);
        
        setUploadStatus('✅ Row deleted successfully!');
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to delete row');
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      setUploadStatus(`❌ Error deleting row: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewRowFieldChange = (fieldName, value) => {
    setNewRowData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Helper function to get API base URL
  const getAPIBaseURL = () => {
    return process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://shipping-drodin.onrender.com' 
        : 'http://localhost:5000');
  };

  const renderDataTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-data">
          <p>No data available</p>
          <button 
            className="action-btn create-btn"
            onClick={startCreateRow}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Create New Row
          </button>
        </div>
      );
    }

    const headers = Object.keys(data[0]);
    const schema = dataSchemas[type];

    return (
      <div className="data-table-container">
        <div className="table-header">
          <h4>Current Data ({data.length} records)</h4>
          <div className="table-actions">
            <button 
              className="action-btn create-btn"
              onClick={startCreateRow}
              disabled={editingRowIndex !== null || showCreateRow}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Create New
            </button>
            <button 
              className="action-btn export-btn"
              onClick={() => exportCurrentData(type)}
              title="Export Current Data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Create New Row Form */}
        {showCreateRow && (
          <div className="create-row-form">
            <div className="form-header">
              <h4>Create New {type.charAt(0).toUpperCase() + type.slice(1)} Record</h4>
            </div>
            <div className="form-fields">
              {headers.filter(header => !schema.readOnly.includes(header)).map(header => (
                <div key={header} className="field-group">
                  <label>{header}{schema.required.includes(header) ? ' *' : ''}</label>
                  {schema.types[header] === 'number' ? (
                    <input
                      type="number"
                      value={newRowData[header] || ''}
                      onChange={(e) => handleNewRowFieldChange(header, parseFloat(e.target.value) || 0)}
                      step="0.01"
                      placeholder={`Enter ${header}`}
                    />
                  ) : schema.types[header] === 'boolean' ? (
                    <select
                      value={newRowData[header] ? 'true' : 'false'}
                      onChange={(e) => handleNewRowFieldChange(header, e.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newRowData[header] || ''}
                      onChange={(e) => handleNewRowFieldChange(header, e.target.value)}
                      placeholder={`Enter ${header}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={cancelCreateRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Cancel
              </button>
              <button className="save-btn" onClick={saveNewRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Save
              </button>
            </div>
          </div>
        )}

        <div className="data-table">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className={editingRowIndex === idx ? 'editing-row' : ''}>
                  {headers.map(header => (
                    <td key={header}>
                      {editingRowIndex === idx ? (
                        // Edit mode
                        schema.readOnly && schema.readOnly.includes(header) ? (
                          <span className="readonly-field" title="Auto-generated - Read Only">{row[header]}</span>
                        ) : schema.types[header] === 'number' ? (
                          <input
                            type="number"
                            value={editingData[header] || ''}
                            onChange={(e) => handleFieldChange(header, parseFloat(e.target.value) || 0)}
                            className="edit-input number-input"
                            step="0.01"
                          />
                        ) : schema.types[header] === 'boolean' ? (
                          <select
                            value={editingData[header] ? 'true' : 'false'}
                            onChange={(e) => handleFieldChange(header, e.target.value === 'true')}
                            className="edit-input"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editingData[header] || ''}
                            onChange={(e) => handleFieldChange(header, e.target.value)}
                            className="edit-input"
                          />
                        )
                      ) : (
                        // View mode
                        <span className="cell-value">
                          {schema.types[header] === 'boolean' 
                            ? (row[header] ? 'Active' : 'Inactive')
                            : row[header]
                          }
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="actions-cell">
                    {editingRowIndex === idx ? (
                      // Edit mode actions
                      <div className="edit-actions">
                        <button 
                          className="action-btn cancel-edit-btn"
                          onClick={cancelEdit}
                          title="Cancel Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn save-edit-btn"
                          onClick={saveEdit}
                          title="Save Changes"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // View mode actions
                      <div className="view-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => startEdit(idx)}
                          disabled={editingRowIndex !== null || showCreateRow}
                          title="Edit Row"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteRow(idx)}
                          disabled={editingRowIndex !== null || showCreateRow}
                          title="Delete Row"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const exportCurrentData = (dataType) => {
    let data, filename;
    
    switch (dataType) {
      case 'providers':
        data = providers;
        filename = 'current_providers.json';
        break;
      case 'states':
        data = states;
        filename = 'current_state_charges.json';
        break;
      case 'fixed':
        data = fixedCharges;
        filename = 'current_fixed_charges.json';
        break;
      default:
        console.error('Unknown data type for export:', dataType);
        return;
    }

    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllSamples = () => {
    // Create sample files for download
    const samples = {
      providers: [
        {
          "Provider Name": "Express Logistics",
          "description": "Fast nationwide delivery service",
          "isActive": true
        }
      ],
      states: [
        {
          "State": "Maharashtra", 
          "Per Kilo Fee (INR)": 25.0,
          "Fuel Surcharge (%)": 12
        }
      ],
      fixed: [
        {
          "Docket Charge (INR)": 50,
          "COD Charge (INR)": 45,
          "Holiday Charge (INR)": 25,
          "Outstation Charge (INR)": 40,
          "Insurance Charge (%)": 2.5,
          "NGT Green Tax (INR)": 10,
          "Kerala North East Handling Charge (INR)": 15
        }
      ]
    };

    Object.entries(samples).forEach(([dataType, sampleData]) => {
      const content = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sample_${dataType}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportAllData = () => {
    // Export all current data as separate files
    ['providers', 'states', 'fixed'].forEach(dataType => {
      exportCurrentData(dataType);
    });
  };

  const reindexDatabase = async () => {
    if (!window.confirm('⚠️ This will reindex and regenerate ALL database records with sequential IDs. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('🔄 Reindexing database... This may take a few moments...');

      const response = await fetch(`${getAPIBaseURL()}/api/reindex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`✅ Database reindexed successfully! ${result.counts.providers} providers, ${result.counts.fixedCharges} fixed charges, ${result.counts.statewiseCharges} statewise charges`);
        
        // Trigger data refresh
        setTimeout(() => {
          window.location.reload(); // Simple way to refresh all data
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to reindex database');
      }

    } catch (error) {
      console.error('Reindex error:', error);
      setUploadStatus(`❌ Error reindexing database: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  if (!isOpen) return null;

  // Show password prompt if not verified
  if (!isPasswordVerified) {
    return (
      <div className="advanced-settings-overlay">
        <div className="password-modal">
          <div className="password-header">
            <h2>🔒 Advanced Settings Access</h2>
            <p>Please enter the administrator password to continue</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="password-input-group">
              <label htmlFor="admin-password">Administrator Password</label>
              <input
                id="admin-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                autoFocus
                required
              />
              {passwordError && (
                <div className="password-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {passwordError}
                </div>
              )}
            </div>
            
            <div className="password-actions">
              <button
                type="button"
                className="password-cancel-btn"
                onClick={handlePasswordClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="password-submit-btn"
                disabled={!passwordInput.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Access Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-settings-overlay">
      <div className="advanced-settings-modal">
        <div className="modal-header">
          <div className="header-left">
            <h2>Advanced Settings</h2>
            <p>Manage pricing data and system configuration</p>
          </div>
          <div className="header-right">
            <div className="dropdown-container">
              <button 
                className="dropdown-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={downloadAllSamples}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Download All Samples
                  </button>
                  <button onClick={exportAllData}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Export All Data
                  </button>
                  <div className="dropdown-divider"></div>
                  <button onClick={reindexDatabase} className="reindex-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    🔄 Reindex Database
                  </button>
                </div>
              )}
            </div>
            <button className="close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="tabs-container">
            
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <div className="tab-content-wrapper">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-description">{tab.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="tab-content">
            <div className="tab-content-header">
              <div className="current-tab-info">
                <span className="current-tab-icon">{tabs.find(t => t.id === activeTab)?.icon}</span>
                <div>
                  <h3 className="current-tab-title">{tabs.find(t => t.id === activeTab)?.label}</h3>
                  <p className="current-tab-description">{tabs.find(t => t.id === activeTab)?.description}</p>
                </div>
              </div>
              <div className="sync-status">
                <span className="sync-indicator">🔄</span>
                <span className="sync-text">Real-time database sync enabled</span>
              </div>
            </div>
            
            {activeTab === 'providers' && (
              <div className="tab-section">
                <div className="section-info">
                  <p>Manage shipping service providers. Changes are synchronized with the database.</p>
                </div>
                {renderDataTable(providers, 'providers')}
              </div>
            )}
            {activeTab === 'states' && (
              <div className="tab-section">
               
                {renderDataTable(states, 'states')}
              </div>
            )}
            {activeTab === 'fixed' && (
              <div className="tab-section">
                <div className="section-info">
                  <p>Set fixed charges for shipments. These are applied per order.</p>
                </div>
                {renderDataTable(fixedCharges, 'fixed')}
              </div>
            )}
          </div>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {isUploading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
