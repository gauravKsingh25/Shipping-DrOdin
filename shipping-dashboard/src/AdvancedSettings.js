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
  
  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const tabs = [
    { id: 'providers', label: 'Providers', icon: '🚚' },
    { id: 'states', label: 'State Charges', icon: '🗺️' },
    { id: 'fixed', label: 'Fixed Charges', icon: '💰' },
    { id: 'upload', label: 'Upload Data', icon: '📤' }
  ];

  // Data validation schemas
  const dataSchemas = {
    providers: {
      required: ['Provider ID', 'Provider Name'],
      optional: ['Status', 'Unnamed: 2'],
      types: {
        'Provider ID': 'string',
        'Provider Name': 'string',
        'Status': 'string',
        'Unnamed: 2': 'string'
      }
    },
    states: {
      required: ['Provider ID', 'State', 'Per Kilo Fee (INR)', 'Fuel Surcharge (%)'],
      optional: [],
      types: {
        'Provider ID': 'string',
        'State': 'string',
        'Per Kilo Fee (INR)': 'number',
        'Fuel Surcharge (%)': 'number'
      }
    },
    fixed: {
      required: ['Provider ID', 'Docket Charge (INR)', 'COD Charge (INR)'],
      optional: ['Holiday Charge (INR)', 'Outstation Charge (INR)'],
      types: {
        'Provider ID': 'string',
        'Docket Charge (INR)': 'number',
        'COD Charge (INR)': 'number',
        'Holiday Charge (INR)': 'number',
        'Outstation Charge (INR)': 'number'
      }
    }
  };

  const validateData = (data, dataType) => {
    const schema = dataSchemas[dataType];
    if (!schema) {
      return { isValid: false, errors: ['Unknown data type'], warnings: [] };
    }

    const errors = [];
    const warnings = [];
    const validatedData = [];

    // Check if data is array
    if (!Array.isArray(data)) {
      return { isValid: false, errors: ['Data must be an array'], warnings: [] };
    }

    if (data.length === 0) {
      return { isValid: false, errors: ['Data cannot be empty'], warnings: [] };
    }

    // Get all unique headers from the data
    const allHeaders = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => allHeaders.add(key));
    });

    // Check for required fields
    const missingRequired = schema.required.filter(field => !allHeaders.has(field));
    if (missingRequired.length > 0) {
      errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    // Check for unexpected fields
    const allowedFields = [...schema.required, ...schema.optional];
    const unexpectedFields = Array.from(allHeaders).filter(field => !allowedFields.includes(field));
    if (unexpectedFields.length > 0) {
      warnings.push(`Unexpected columns found (will be ignored): ${unexpectedFields.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowErrors = [];
      const validatedRow = {};

      // Check required fields in each row
      schema.required.forEach(field => {
        const value = row[field];
        if (value === undefined || value === null || value === '') {
          rowErrors.push(`Row ${index + 1}: Missing required field '${field}'`);
        } else {
          // Type validation and conversion
          const expectedType = schema.types[field];
          if (expectedType === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              rowErrors.push(`Row ${index + 1}: '${field}' must be a number, got '${value}'`);
            } else {
              validatedRow[field] = numValue;
            }
          } else {
            validatedRow[field] = String(value).trim();
          }
        }
      });

      // Process optional fields
      schema.optional.forEach(field => {
        const value = row[field];
        if (value !== undefined && value !== null && value !== '') {
          const expectedType = schema.types[field];
          if (expectedType === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              warnings.push(`Row ${index + 1}: Optional field '${field}' is not a valid number, setting to 0`);
              validatedRow[field] = 0;
            } else {
              validatedRow[field] = numValue;
            }
          } else {
            validatedRow[field] = String(value).trim();
          }
        } else if (schema.types[field] === 'number') {
          validatedRow[field] = 0;
        }
      });

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validatedData.push(validatedRow);
      }
    });

    // Additional business logic validation
    if (dataType === 'providers') {
      const providerIds = validatedData.map(p => p['Provider ID']);
      const duplicateIds = providerIds.filter((id, index) => providerIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate Provider IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
      }
    }

    if (dataType === 'states') {
      // Check for negative values
      validatedData.forEach((row, index) => {
        if (row['Per Kilo Fee (INR)'] < 0) {
          errors.push(`Row ${index + 1}: Per Kilo Fee cannot be negative`);
        }
        if (row['Fuel Surcharge (%)'] < 0 || row['Fuel Surcharge (%)'] > 100) {
          warnings.push(`Row ${index + 1}: Fuel Surcharge should be between 0-100%`);
        }
      });
    }

    if (dataType === 'fixed') {
      // Check for negative charges
      validatedData.forEach((row, index) => {
        Object.keys(row).forEach(key => {
          if (key.includes('Charge') && row[key] < 0) {
            errors.push(`Row ${index + 1}: ${key} cannot be negative`);
          }
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedData: errors.length === 0 ? validatedData : []
    };
  };

  const handleFileUpload = (event, dataType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Only accept CSV and JSON files
    const isCSV = file.name.endsWith('.csv');
    const isJSON = file.name.endsWith('.json');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isJSON && !isExcel) {
      setUploadStatus('❌ Please select a CSV, JSON, or Excel file');
      setTimeout(() => setUploadStatus(''), 5000);
      return;
    }

    setIsUploading(true);
    setUploadStatus('📁 Reading file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let jsonData;
        
        if (isCSV) {
          setUploadStatus('📊 Parsing CSV data...');
          jsonData = parseCSV(e.target.result, dataType);
        } else if (isJSON) {
          setUploadStatus('📊 Parsing JSON data...');
          jsonData = JSON.parse(e.target.result);
        } else if (isExcel) {
          setUploadStatus('❌ Excel files are not supported yet. Please convert to CSV format.');
          setIsUploading(false);
          setTimeout(() => setUploadStatus(''), 5000);
          return;
        }
        
        setUploadStatus('✅ Validating data structure...');
        
        // Validate the parsed data
        const validation = validateData(jsonData, dataType);
        
        // Set preview data regardless of validation result
        setPreviewData({
          type: dataType,
          data: jsonData,
          validatedData: validation.validatedData
        });
        setValidationResult(validation);
        
        if (validation.isValid) {
          setUploadStatus(`✅ File processed successfully! ${validation.validatedData.length} valid records found.`);
        } else {
          setUploadStatus(`⚠️ File processed with errors. Please review the preview below.`);
        }
        
        // Clear the file input
        event.target.value = '';
        
      } catch (error) {
        console.error('File upload error:', error);
        setUploadStatus(`❌ Error processing file: ${error.message}`);
        setPreviewData(null);
        setValidationResult(null);
      } finally {
        setIsUploading(false);
        setTimeout(() => {
          if (!previewData) {
            setUploadStatus('');
          }
        }, 5000);
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (csvText, dataType) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) {
        continue; // Skip empty rows
      }
      
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index].trim();
      });
      
      data.push(row);
    }

    if (data.length === 0) {
      throw new Error('No valid data rows found in CSV file');
    }

    return data;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleSavePreview = () => {
    if (!previewData || !validationResult || !validationResult.isValid) {
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSave = () => {
    if (previewData && validationResult && validationResult.isValid) {
      onDataUpdate(previewData.type, validationResult.validatedData);
      setPreviewData(null);
      setValidationResult(null);
      setShowConfirmation(false);
      setUploadStatus('✅ Data saved successfully! Database has been updated.');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const cancelPreview = () => {
    setPreviewData(null);
    setValidationResult(null);
    setUploadStatus('');
  };

  const downloadSampleFile = (dataType, format = 'json') => {
    let sampleData = [];
    let filename = '';

    switch (dataType) {
      case 'providers':
        sampleData = [
          {
            "Provider ID": "P001",
            "Provider Name": "Express Logistics",
            "Status": "Active"
          },
          {
            "Provider ID": "P002",
            "Provider Name": "QuickShip",
            "Status": "Inactive"
          }
        ];
        filename = format === 'csv' ? 'providers_template.csv' : 'sample_providers.json';
        break;
      case 'states':
        sampleData = [
          {
            "Provider ID": "P001",
            "State": "Maharashtra",
            "Per Kilo Fee (INR)": 25.0,
            "Fuel Surcharge (%)": 12
          },
          {
            "Provider ID": "P001",
            "State": "Karnataka",
            "Per Kilo Fee (INR)": 28.0,
            "Fuel Surcharge (%)": 10
          }
        ];
        filename = format === 'csv' ? 'state_charges_template.csv' : 'sample_state_charges.json';
        break;
      case 'fixed':
        sampleData = [
          {
            "Provider ID": "P001",
            "Docket Charge (INR)": 50,
            "COD Charge (INR)": 45,
            "Holiday Charge (INR)": 25,
            "Outstation Charge (INR)": 40
          },
          {
            "Provider ID": "P002",
            "Docket Charge (INR)": 55,
            "COD Charge (INR)": 50,
            "Holiday Charge (INR)": 30,
            "Outstation Charge (INR)": 45
          }
        ];
        filename = format === 'csv' ? 'fixed_charges_template.csv' : 'sample_fixed_charges.json';
        break;
      default:
        return;
    }

    let content, mimeType;
    
    if (format === 'csv') {
      const headers = Object.keys(sampleData[0]);
      const csvHeaders = headers.join(',');
      const csvRows = sampleData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && (value.includes(',') || value.includes(' ')) 
            ? `"${value}"` 
            : value;
        }).join(',')
      );
      content = [csvHeaders, ...csvRows].join('\n');
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(sampleData, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderDataTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-data">
          <p>No data available</p>
        </div>
      );
    }

    const headers = Object.keys(data[0]);
    const displayData = data.slice(0, 10);

    return (
      <div className="data-table-container">
        <div className="table-header">
          <h4>Current Data ({data.length} records)</h4>
          <div className="table-actions">
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
        <div className="data-table">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx}>
                  {headers.map(header => (
                    <td key={header}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="table-footer">
              <p>Showing 10 of {data.length} records</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewData || !validationResult) return null;

    const { data, type } = previewData;
    const { isValid, errors, warnings, validatedData } = validationResult;

    return (
      <div className="data-preview-container">
        <div className="preview-header">
          <h4>
            📋 Data Preview - {type.charAt(0).toUpperCase() + type.slice(1)}
          </h4>
          <div className="preview-stats">
            <div className="stat-item">
              <span>📊</span>
              <span>{data.length} rows</span>
            </div>
            <div className="stat-item">
              <span>✅</span>
              <span>{validatedData.length} valid</span>
            </div>
            {errors.length > 0 && (
              <div className="stat-item">
                <span>❌</span>
                <span>{errors.length} errors</span>
              </div>
            )}
          </div>
        </div>

        <div className={`validation-status ${isValid ? 'validation-success' : 'validation-error'}`}>
          <div className="validation-message">
            <span>{isValid ? '✅' : '❌'}</span>
            <span>
              {isValid 
                ? `Data validation passed! ${validatedData.length} records ready to save.` 
                : `Data validation failed! Please fix the errors below.`
              }
            </span>
          </div>
          
          {errors.length > 0 && (
            <div className="validation-details">
              <strong>Errors:</strong>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="validation-details">
              <strong>Warnings:</strong>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {data.length > 0 && Object.keys(data[0]).map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(row).map(header => (
                    <td 
                      key={header}
                      className={
                        errors.some(error => error.includes(`Row ${idx + 1}`) && error.includes(`'${header}'`))
                          ? 'error-cell'
                          : ''
                      }
                    >
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 20 && (
            <div className="table-footer">
              <p>Showing 20 of {data.length} rows</p>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <div className="preview-actions-left">
            <button className="preview-btn cancel-btn" onClick={cancelPreview}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Cancel
            </button>
          </div>
          <div className="preview-actions-right">
            <button 
              className="preview-btn save-preview-btn"
              onClick={handleSavePreview}
              disabled={!isValid}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2"/>
                <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Save to Database
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadSection = () => {
    const uploadCards = [
      {
        type: 'providers', 
        title: 'Providers Data', 
        description: 'Upload provider information and names',
        fields: ['Provider ID', 'Provider Name', 'Status (Optional)']
      },
      {
        type: 'states', 
        title: 'State Charges', 
        description: 'Upload per-kilo fees and fuel surcharges by state',
        fields: ['Provider ID', 'State', 'Per Kilo Fee (INR)', 'Fuel Surcharge (%)']
      },
      {
        type: 'fixed', 
        title: 'Fixed Charges', 
        description: 'Upload docket, COD, holiday, and outstation charges',
        fields: ['Provider ID', 'Docket Charge (INR)', 'COD Charge (INR)', 'Holiday Charge (INR)', 'Outstation Charge (INR)']
      }
    ];

    return (
      <div className="upload-section">
        <div className="upload-info-banner">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>Data Upload Instructions</h4>
            <ul>
              <li><strong>File Formats:</strong> CSV (recommended) or JSON files</li>
              <li><strong>Validation:</strong> All data is validated before saving</li>
              <li><strong>Preview:</strong> Review your data before it overwrites the database</li>
              <li><strong>Required Fields:</strong> Download templates for exact column formats</li>
              <li><strong>Data Override:</strong> Saving will replace ALL existing data</li>
            </ul>
          </div>
        </div>

        {previewData && renderPreview()}

        {!previewData && (
          <div className="upload-cards">
            {uploadCards.map(({ type, title, description, fields }) => (
              <div key={type} className="upload-card">
                <div className="upload-card-header">
                  <h4>{title}</h4>
                  <p>{description}</p>
                  <div className="required-fields">
                    <strong>Required columns:</strong>
                    <div className="field-tags">
                      {fields.map(field => (
                        <span key={field} className="field-tag">{field}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="upload-card-actions">
                  <div className="template-downloads">
                    <button
                      className="template-btn csv-btn"
                      onClick={() => downloadSampleFile(type, 'csv')}
                      title="Download CSV Template"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      CSV Template
                    </button>
                    <button
                      className="template-btn json-btn"
                      onClick={() => downloadSampleFile(type, 'json')}
                      title="Download JSON Template"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      JSON Template
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => handleFileUpload(e, type)}
                    className="file-input"
                    id={`upload-${type}`}
                    disabled={isUploading}
                  />
                  <label htmlFor={`upload-${type}`} className={`upload-btn ${isUploading ? 'disabled' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {isUploading ? 'Processing...' : 'Upload File'}
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : 'success'}`}>
            {uploadStatus}
          </div>
        )}
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

  if (!isOpen) return null;

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
                  <button onClick={() => downloadSampleFile('providers')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Download All Samples
                  </button>
                  <button onClick={() => exportCurrentData('providers')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Export All Data
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
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tab-content">
            {activeTab === 'providers' && renderDataTable(providers, 'providers')}
            {activeTab === 'states' && renderDataTable(states, 'states')}
            {activeTab === 'fixed' && renderDataTable(fixedCharges, 'fixed')}
            {activeTab === 'upload' && renderUploadSection()}
          </div>
        </div>

        {isUploading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing file...</p>
          </div>
        )}

        {showConfirmation && (
          <div className="confirmation-dialog">
            <div className="confirmation-content">
              <div className="confirmation-icon">⚠️</div>
              <h3 className="confirmation-title">Confirm Data Override</h3>
              <p className="confirmation-message">
                This action will completely replace the existing {previewData?.type} data with your uploaded data. 
                This action cannot be undone. Are you sure you want to continue?
              </p>
              <div className="confirmation-actions">
                <button 
                  className="preview-btn cancel-btn"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  className="preview-btn confirm-btn"
                  onClick={confirmSave}
                >
                  Yes, Override Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
