import React, { useEffect, useState, useCallback } from "react";
import BoxDialog from "./BoxDialog";
import ExportDialog from "./ExportDialog";
import AdvancedSettings from "./AdvancedSettings";

export default function Dashboard() {
  const [providers, setProviders] = useState([]);
  const [states, setStates] = useState([]);
  const [statewiseCharges, setStatewiseCharges] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [results, setResults] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(null);
  const [vendorName, setVendorName] = useState("");
  const [savedSelections, setSavedSelections] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [boxDialogOpen, setBoxDialogOpen] = useState(false);
  const [boxToDuplicate, setBoxToDuplicate] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Add advanced settings state
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Add missing state for checkboxes
  const [cod, setCOD] = useState(false);
  const [holiday, setHoliday] = useState(false);
  const [outstation, setOutstation] = useState(false);

  // Add new states for shipment value and insurance
  const [shipmentValue, setShipmentValue] = useState("");
  const [insurancePercentage, setInsurancePercentage] = useState("");

  // API base URL - use environment variable with fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://shipping-drodin.onrender.com' 
      : 'http://localhost:5000');

  const loadSavedSelections = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/selections`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setSavedSelections(result.data || []);
      }
    } catch (error) {
      console.error('Error loading saved selections:', error);
      setSavedSelections([]);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // Load data from API
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch providers
        const providersResponse = await fetch(`${API_BASE_URL}/api/providers`);
        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          // Transform MongoDB data to match expected format
          const transformedProviders = providersData.map(p => ({
            "Provider ID": p.providerId,
            "Provider Name": p.providerName,
            description: p.description,
            isActive: p.isActive
          }));
          setProviders(transformedProviders);
        }

        // Fetch fixed charges
        const fixedChargesResponse = await fetch(`${API_BASE_URL}/api/charges/fixed`);
        if (fixedChargesResponse.ok) {
          const fixedChargesData = await fixedChargesResponse.json();
          // Transform MongoDB data to match expected format
          const transformedFixedCharges = fixedChargesData.map(f => ({
            "Provider ID": f.providerId,
            "Docket Charge (INR)": f.docketCharge,
            "COD Charge (INR)": f.codCharge,
            "Holiday Charge (INR)": f.holidayCharge,
            "Outstation Charge (INR)": f.outstationCharge,
            "Insurance Charge (%)": f.insuranceChargePercent,
            "NGT Green Tax (INR)": f.ngtGreenTax,
            "Kerala North East Handling Charge (INR)": f.keralaHandlingCharge
          }));
          setFixedCharges(transformedFixedCharges);
        }

        // Fetch statewise charges
        const statewiseChargesResponse = await fetch(`${API_BASE_URL}/api/charges/statewise`);
        if (statewiseChargesResponse.ok) {
          const statewiseChargesData = await statewiseChargesResponse.json();
          // Transform MongoDB data to match expected format
          const transformedStatewiseCharges = statewiseChargesData.map(s => ({
            "_id": s._id, // Include MongoDB ID for updates
            "Provider ID": s.providerId,
            "Provider Name": s.providerName,
            "State": s.state,
            "Per Kilo Fee (INR)": s.perKiloFee,
            "Fuel Surcharge (%)": s.fuelSurcharge
          }));
          setStatewiseCharges(transformedStatewiseCharges);
          
          // Extract unique states from the statewise charges data
          const uniqueStates = [...new Set(transformedStatewiseCharges.map(charge => charge.State))].sort();
          setStates(uniqueStates);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    loadSavedSelections();
  }, [API_BASE_URL, loadSavedSelections]);

  const openAddBoxDialog = () => {
    setBoxToDuplicate(null);
    setBoxDialogOpen(true);
  };

  const openDuplicateBoxDialog = idx => {
    const boxToDuplicate = boxes[idx];
    const duplicatedBox = { ...boxToDuplicate, quantity: boxToDuplicate.quantity };
    setBoxes(prev => [...prev, duplicatedBox]);
  };

  const handleAddBox = box => {
    if (boxToDuplicate) {
      // Duplicate: update quantity for the box
      setBoxes(prev =>
        prev.map(b =>
          b === boxToDuplicate
            ? { ...b, quantity: box.quantity }
            : b
        )
      );
    } else {
      setBoxes(prev => [...prev, box]);
    }
    setBoxDialogOpen(false);
    setBoxToDuplicate(null);
  };

  const handleRemoveBox = idx => {
    setBoxes(prev => prev.filter((_, i) => i !== idx));
  };

  const calculate = () => {
    if (!selectedState || boxes.length === 0) {
      alert('Please select a state and add at least one box');
      return;
    }

    // Validate data is loaded
    if (!states.length || !providers.length || !fixedCharges.length || !statewiseCharges.length) {
      alert('Configuration data is still loading. Please wait and try again.');
      return;
    }

    console.log('Calculating for state:', selectedState);
    console.log('Available states:', states);

    // Filter statewise charges for the selected state
    const stateFiltered = statewiseCharges.filter(s => s.State && s.State.toLowerCase() === selectedState.toLowerCase());
    
    if (stateFiltered.length === 0) {
      alert(`No data found for state: ${selectedState}`);
      return;
    }

    console.log('Filtered state data:', stateFiltered);

    const providerResults = stateFiltered.map(stateRow => {
      const vendorId = stateRow["Provider ID"];
      const provider = providers.find(p => p["Provider ID"] === vendorId);
      const fixed = fixedCharges.find(f => f["Provider ID"] === vendorId);

      if (!provider) {
        console.warn(`Provider not found for ID: ${vendorId}`);
      }

      let totalApplicableWeight = 0;
      boxes.forEach(box => {
        const volWeight = (box.length * box.breadth * box.height) / 5000;
        const applicableWeight = Math.max(volWeight, box.deadWeight);
        totalApplicableWeight += applicableWeight * box.quantity;
      });

      const perKilo = Number(stateRow["Per Kilo Fee (INR)"]) || 0;
      const fuelPct = Number(stateRow["Fuel Surcharge (%)"]) || 0;
      const baseCost = perKilo * totalApplicableWeight;
      const fuelCharge = (baseCost * fuelPct) / 100;

      const totalBoxes = boxes.reduce((sum, box) => sum + box.quantity, 0);
      
      // Fixed charges applied only ONCE per shipment (not per box)
      const docket = Number(fixed?.["Docket Charge (INR)"]) || 0;
      const codCharge = cod ? (Number(fixed?.["COD Charge (INR)"]) || 0) : 0;
      const holidayCharge = holiday ? (Number(fixed?.["Holiday Charge (INR)"]) || 0) : 0;
      const outstationCharge = outstation ? (Number(fixed?.["Outstation Charge (INR)"]) || 0) : 0;
      
      // NGT Green Tax - fixed charge per shipment
      const ngtGreenTax = Number(fixed?.["NGT Green Tax (INR)"]) || 0;
      
      // Insurance charge - percentage of shipment value
      let insuranceCharge = 0;
      if (shipmentValue && insurancePercentage && !isNaN(shipmentValue) && !isNaN(insurancePercentage)) {
        const insuranceRate = Number(fixed?.["Insurance Charge (%)"]) || 0;
        insuranceCharge = (Number(shipmentValue) * Number(insurancePercentage) * insuranceRate) / 10000; // percentage of percentage
      }
      
      // Kerala/North East handling charge - per box for specific states
      let stateSpecificCharge = 0;
      const isKeralaOrNorthEast = selectedState.toLowerCase().includes('kerala') || 
                                 selectedState.toLowerCase().includes('assam') ||
                                 selectedState.toLowerCase().includes('manipur') ||
                                 selectedState.toLowerCase().includes('meghalaya') ||
                                 selectedState.toLowerCase().includes('mizoram') ||
                                 selectedState.toLowerCase().includes('nagaland') ||
                                 selectedState.toLowerCase().includes('tripura') ||
                                 selectedState.toLowerCase().includes('arunachal pradesh');
      
      if (isKeralaOrNorthEast) {
        const handlingChargePerBox = Number(fixed?.["Kerala North East Handling Charge (INR)"]) || 15;
        stateSpecificCharge = handlingChargePerBox * totalBoxes;
      }

      const total = baseCost + fuelCharge + docket + codCharge + holidayCharge + 
                   outstationCharge + ngtGreenTax + insuranceCharge + stateSpecificCharge;

      return {
        providerName: provider?.["Provider Name"] || `Unknown Provider (ID: ${vendorId})`,
        applicableWeight: totalApplicableWeight.toFixed(2),
        baseCost: baseCost.toFixed(2),
        fuelCharge: fuelCharge.toFixed(2),
        docket: docket.toFixed(2),
        codCharge: codCharge.toFixed(2),
        holidayCharge: holidayCharge.toFixed(2),
        outstationCharge: outstationCharge.toFixed(2),
        ngtGreenTax: ngtGreenTax.toFixed(2),
        insuranceCharge: insuranceCharge.toFixed(2),
        stateSpecificCharge: stateSpecificCharge.toFixed(2),
        total: total.toFixed(2),
      };
    });

    console.log('Provider results:', providerResults);

    providerResults.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
    setResults(providerResults);
    setExpandedIdx(null);
    setSelectedProviderIdx(null);
    setVendorName("");
  };

  const handleProviderSelect = idx => {
    setSelectedProviderIdx(idx);
    setVendorName("");
  };

  const handleSaveSelection = async () => {
    if (!vendorName.trim()) {
      alert('Please enter a vendor name');
      return;
    }

    const provider = results[selectedProviderIdx];
    if (!provider) {
      alert('Please select a provider first');
      return;
    }

    setLoading(true);
    const selection = {
      vendorName: vendorName.trim(),
      providerName: provider.providerName,
      total: parseFloat(provider.total),
      date: new Date().toISOString().slice(0, 10)
    };

    try {
      console.log('Sending selection:', selection);
      const response = await fetch(`${API_BASE_URL}/api/selections/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selection)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Save response:', result);
      
      if (result.success) {
        alert('Selection saved successfully!');
        setSavedSelections(prev => [result.data, ...prev]);
        setSelectedProviderIdx(null);
        setVendorName("");
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      let errorMessage = 'Failed to save selection. ';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check if the backend server is running on port 5000.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setExportDialogOpen(true);
    // Set default dates to min/max in savedSelections if available
    if (savedSelections.length > 0) {
      const dates = savedSelections.map(s => s.date).sort();
      setExportStartDate(dates[0]);
      setExportEndDate(dates[dates.length - 1]);
    }
    // Reset vendor selection
    setSelectedVendor("");
  };

  // Get unique vendor names for the dropdown
  const uniqueVendors = [...new Set(savedSelections.map(s => s.vendorName))].sort();

  const handleExportConfirm = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    // Validate date range
    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      alert('Start date cannot be after end date');
      return;
    }

    setExportLoading(true);
    
    try {
      console.log('Starting export with params:', {
        startDate: exportStartDate,
        endDate: exportEndDate,
        selectedVendor
      });

      // Build query parameters
      const params = new URLSearchParams({
        startDate: exportStartDate,
        endDate: exportEndDate
      });

      // Fetch data from the range endpoint
      const response = await fetch(`${API_BASE_URL}/api/selections/range?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Export API response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      let dataToExport = result.data || [];

      // Filter by vendor if selected
      if (selectedVendor && selectedVendor.trim()) {
        dataToExport = dataToExport.filter(s => 
          s.vendorName && s.vendorName.toLowerCase().includes(selectedVendor.toLowerCase())
        );
      }

      console.log('Data to export:', dataToExport);

      if (dataToExport.length === 0) {
        alert('No data found for the selected criteria');
        return;
      }

      // Create CSV with proper escaping
      const csvHeaders = "Vendor Name,Provider Name,Total (INR),Date,Created At";
      const csvRows = dataToExport.map(selection => {
        // Safely format each field
        const vendorName = String(selection.vendorName || '').replace(/"/g, '""');
        const providerName = String(selection.providerName || '').replace(/"/g, '""');
        const total = Number(selection.total || 0).toFixed(2);
        const date = selection.date || 'N/A';
        const createdAt = selection.createdAt 
          ? new Date(selection.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : 'N/A';
        
        return `"${vendorName}","${providerName}",${total},"${date}","${createdAt}"`;
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");
      console.log('CSV content created, length:', csvContent.length);
      
      // Create and download file with better browser compatibility
      const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
      const blob = new Blob([BOM + csvContent], { 
        type: "text/csv;charset=utf-8;" 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      
      // Create filename with date range and vendor info
      const formatDateForFilename = (dateStr) => dateStr.replace(/-/g, '');
      const vendorSuffix = selectedVendor 
        ? `_${selectedVendor.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}` 
        : '';
      const filename = `provider_selections_${formatDateForFilename(exportStartDate)}_to_${formatDateForFilename(exportEndDate)}${vendorSuffix}.csv`;
      
      link.href = url;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated for file:', filename);
      
      // Close dialog and show success message
      setExportDialogOpen(false);
      alert(`Successfully exported ${dataToExport.length} records to ${filename}!`);
      
    } catch (error) {
      console.error('Export error:', error);
      
      let errorMessage = 'Export failed: ';
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage += 'Export endpoint not found. Please contact support.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  // Add function to handle data updates from advanced settings
  const handleDataUpdate = async (dataType, newData) => {
    // Validate that newData is an array and has the correct structure
    if (!Array.isArray(newData) || newData.length === 0) {
      console.error('Invalid data provided for update:', dataType);
      alert('Error: Invalid data format. Please check your upload file.');
      return;
    }

    // Additional validation based on data type
    let isValidStructure = false;
    switch (dataType) {
      case 'providers':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('Provider Name')
        );
        break;
      case 'states':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('State') &&
          item.hasOwnProperty('Per Kilo Fee (INR)') &&
          item.hasOwnProperty('Fuel Surcharge (%)')
        );
        break;
      case 'fixed':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('Docket Charge (INR)') &&
          item.hasOwnProperty('COD Charge (INR)')
        );
        break;
      default:
        console.warn('Unknown data type:', dataType);
        return;
    }

    if (!isValidStructure) {
      console.error('Data structure validation failed for:', dataType);
      alert(`Error: Uploaded ${dataType} data does not have the required structure. Please check your file format.`);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      switch (dataType) {
        case 'providers':
          endpoint = `${API_BASE_URL}/api/providers/bulk-update`;
          payload = { providers: newData };
          break;
        case 'states':
          endpoint = `${API_BASE_URL}/api/charges/statewise/bulk-update`;
          payload = { charges: newData };
          break;
        case 'fixed':
          endpoint = `${API_BASE_URL}/api/charges/fixed/bulk-update`;
          payload = { charges: newData };
          break;
        default:
          console.warn('Unknown data type:', dataType);
          return;
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
        // Update local state after successful API call
        switch (dataType) {
          case 'providers':
            setProviders(newData);
            localStorage.setItem('customProviders', JSON.stringify(newData));
            console.log(`Updated ${newData.length} provider records`);
            break;
          case 'states':
            // Transform the statewise charges data and extract unique states
            setStatewiseCharges(newData);
            const uniqueStates = [...new Set(newData.map(s => s.State))].sort();
            setStates(uniqueStates);
            localStorage.setItem('customStates', JSON.stringify(newData));
            console.log(`Updated ${newData.length} state charge records`);
            break;
          case 'fixed':
            setFixedCharges(newData);
            localStorage.setItem('customFixedCharges', JSON.stringify(newData));
            console.log(`Updated ${newData.length} fixed charge records`);
            break;
          default:
            console.warn('Unknown data type:', dataType);
            break;
        }
        
        // Clear current results to force recalculation with new data
        setResults([]);
        setSelectedProviderIdx(null);
        setSelectedState(""); // Reset state selection to force user to reselect
        
        // Show success message
        alert(`Successfully updated ${dataType} data with ${newData.length} records. Database has been updated. Please reselect your state and recalculate.`);
      } else {
        throw new Error(result.error || 'Failed to update data');
      }
      
    } catch (error) {
      console.error('Error updating data:', error);
      let errorMessage = `Error saving ${dataType} data: `;
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Unable to connect to server. Please check if the backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Modern animated background */}
      <div className="dashboard-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Three-dots menu button in top right corner */}
      <button
        className="page-settings-btn"
        onClick={() => setAdvancedSettingsOpen(true)}
        title="Advanced Settings & Data Management"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="19" cy="12" r="1" fill="currentColor"/>
          <circle cx="5" cy="12" r="1" fill="currentColor"/>
        </svg>
      </button>

      <div className="dashboard-layout">
        {/* Left Panel - Input Form */}
        <div className="dashboard-left-panel">
          <div className="form-card">
            <div className="form-header">
              <div className="header-main">
                <h1 className="form-title">
                  <span className="title-icon">📦</span>
                  Shipping Calculator
                </h1>
                <p className="form-subtitle">Calculate optimal shipping costs across providers</p>
              </div>
            </div>

            <div className="form-content">
              {/* State Selection */}
              <div className="input-group">
                <label className="input-label">
                  <span className="label-text">Destination State</span>
                  <span className="label-required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="modern-select"
                  >
                    <option value="">Choose your state</option>
                    {states.map((state, i) => (
                      <option key={i} value={state}>{state}</option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Shipment Value and Insurance Section */}
              <div className="shipment-section">
                <h3 className="section-title">Shipment Details</h3>
                <div className="input-row">
                  <div className="input-group half-width">
                    <label className="input-label">
                      <span className="label-text">Total Shipment Value (₹)</span>
                    </label>
                    <input
                      type="number"
                      value={shipmentValue}
                      onChange={(e) => setShipmentValue(e.target.value)}
                      placeholder="Enter total value"
                      className="modern-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="input-group half-width">
                    <label className="input-label">
                      <span className="label-text">Insurance Coverage (%)</span>
                    </label>
                    <input
                      type="number"
                      value={insurancePercentage}
                      onChange={(e) => setInsurancePercentage(e.target.value)}
                      placeholder="e.g., 100"
                      className="modern-input"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              {/* Boxes Section */}
              <div className="boxes-section">
                <div className="section-header">
                  <h3 className="section-title">Package Details</h3>
                  <span className="required-badge">Required</span>
                </div>
                
                <div className="boxes-list">
                  {boxes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <p className="empty-text">No packages added yet</p>
                      <p className="empty-subtext">Add your first package to get started</p>
                    </div>
                  ) : (
                    boxes.map((box, idx) => (
                      <div key={idx} className="box-item">
                        <div className="box-info">
                          <div className="box-header">
                            <span className="box-label">Package {idx + 1}</span>
                            <span className="box-qty">×{box.quantity}</span>
                          </div>
                          <div className="box-details">
                            <span className="dimension-badge">
                              {box.length}×{box.breadth}×{box.height} cm
                            </span>
                            <span className="weight-badge">
                              {box.deadWeight} kg
                            </span>
                          </div>
                        </div>
                        <div className="box-actions">
                          <button
                            className="action-btn duplicate-btn"
                            onClick={() => openDuplicateBoxDialog(idx)}
                            title="Duplicate Package"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                          <button
                            className="action-btn remove-btn"
                            onClick={() => handleRemoveBox(idx)}
                            title="Remove Package"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="add-box-btn" onClick={openAddBoxDialog}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Add Package
                </button>
              </div>

              {/* Additional Services */}
              <div className="services-section">
                <h3 className="section-title">Additional Services</h3>
                <div className="checkbox-grid">
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={cod} 
                      onChange={(e) => setCOD(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Cash on Delivery</span>
                  </label>
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={holiday} 
                      onChange={(e) => setHoliday(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Holiday Delivery</span>
                  </label>
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={outstation} 
                      onChange={(e) => setOutstation(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Outstation Delivery</span>
                  </label>
                </div>
              </div>

              <button
                className="calculate-btn"
                onClick={calculate}
                disabled={!selectedState || boxes.length === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11H3m3 8l-3-3 3-3m8-5l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Calculate Shipping Costs
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="dashboard-right-panel">
          <div className="results-card">
            {/* Export button */}
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={savedSelections.length === 0}
              title="Export Provider Data"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="results-header">
              <h2 className="results-title">Provider Comparison</h2>
              <p className="results-subtitle">Compare shipping costs across different providers</p>
            </div>

            {/* Provider selection form */}
            {selectedProviderIdx !== null && (
              <div className="vendor-form">
                <div className="vendor-header">
                  <h4 className="vendor-title">
                    Save Selection for <span className="provider-name">{results[selectedProviderIdx].providerName}</span>
                  </h4>
                </div>
                <div className="vendor-input-group">
                  <input
                    type="text"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    placeholder="Enter vendor name"
                    className="vendor-input"
                  />
                  <button
                    className="save-btn"
                    onClick={handleSaveSelection}
                    disabled={loading || !vendorName.trim()}
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {/* Results list */}
            <div className="results-content">
              {results.length === 0 ? (
                <div className="empty-results">
                  <div className="empty-results-icon">🚚</div>
                  <h3 className="empty-results-title">No Results Yet</h3>
                  <p className="empty-results-text">
                    Select a state and add packages to compare shipping providers
                  </p>
                </div>
              ) : (
                <div className="provider-list">
                  {results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`provider-card ${expandedIdx === idx ? 'expanded' : ''} ${selectedProviderIdx === idx ? 'selected' : ''}`}
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="provider-header">
                        <div className="provider-info">
                          <h4 className="provider-name">{r.providerName}</h4>
                          <div className="provider-weight">
                            Weight: {r.applicableWeight} kg
                          </div>
                        </div>
                        <div className="provider-price">
                          <span className="currency">₹</span>
                          <span className="amount">{r.total}</span>
                        </div>
                      </div>

                      {expandedIdx === idx && (
                        <div className="provider-details">
                          <div className="cost-breakdown">
                            <div className="cost-item">
                              <span className="cost-label">Base Cost</span>
                              <span className="cost-value">₹{r.baseCost}</span>
                            </div>
                            <div className="cost-item">
                              <span className="cost-label">Fuel Surcharge</span>
                              <span className="cost-value">₹{r.fuelCharge}</span>
                            </div>
                            <div className="cost-item">
                              <span className="cost-label">Docket Charge</span>
                              <span className="cost-value">₹{r.docket}</span>
                            </div>
                            {parseFloat(r.codCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">COD Charge</span>
                                <span className="cost-value">₹{r.codCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.holidayCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Holiday Charge</span>
                                <span className="cost-value">₹{r.holidayCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.outstationCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Outstation Charge</span>
                                <span className="cost-value">₹{r.outstationCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.ngtGreenTax) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">NGT Green Tax</span>
                                <span className="cost-value">₹{r.ngtGreenTax}</span>
                              </div>
                            )}
                            {parseFloat(r.insuranceCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Insurance Charge</span>
                                <span className="cost-value">₹{r.insuranceCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.stateSpecificCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Kerala/NE Handling</span>
                                <span className="cost-value">₹{r.stateSpecificCharge}</span>
                              </div>
                            )}
                          </div>
                          
                          <button
                            className="select-provider-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProviderSelect(idx);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Select This Provider
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BoxDialog
        open={boxDialogOpen}
        onClose={() => setBoxDialogOpen(false)}
        onAdd={handleAddBox}
        boxToDuplicate={boxToDuplicate}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        loading={exportLoading}
        startDate={exportStartDate}
        endDate={exportEndDate}
        setStartDate={setExportStartDate}
        setEndDate={setExportEndDate}
        uniqueVendors={uniqueVendors}
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
        onExport={handleExportConfirm}
      />

      <AdvancedSettings
        isOpen={advancedSettingsOpen}
        onClose={() => setAdvancedSettingsOpen(false)}
        providers={providers}
        states={statewiseCharges}
        fixedCharges={fixedCharges}
        onDataUpdate={handleDataUpdate}
      />
    </div>
  );
}