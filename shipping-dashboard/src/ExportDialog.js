import React from "react";

function ExportDialog({
  open,
  onClose,
  loading,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  uniqueVendors,
  selectedVendor,
  setSelectedVendor,
  onExport
}) {
  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "2rem",
          width: "450px",
          maxWidth: "90vw",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#666",
            padding: "0.25rem"
          }}
          aria-label="Close dialog"
        >
          ×
        </button>

        <h3 style={{ marginBottom: "1.5rem", color: "#2d3748", marginTop: 0 }}>
          Export Provider Data
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {/* Date Range */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px"
                  }}
                />
              </div>
            </div>

            {/* Vendor Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Filter by Vendor (Optional)
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              >
                <option value="">All Vendors</option>
                {uniqueVendors.map((vendor, index) => (
                  <option key={index} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            {/* Info text */}
            <div style={{ 
              fontSize: "0.875rem", 
              color: "#666", 
              backgroundColor: "#f7fafc", 
              padding: "0.75rem", 
              borderRadius: "6px",
              border: "1px solid #e2e8f0"
            }}>
              <strong>Export will include:</strong> Vendor Name, Provider Name, Total Cost, Date, and Created Timestamp
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !startDate || !endDate}
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "none",
                borderRadius: "6px",
                background: (loading || !startDate || !endDate) ? "#ccc" : "#007bff",
                color: "#fff",
                cursor: (loading || !startDate || !endDate) ? "not-allowed" : "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              {loading && (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}
                />
              )}
              {loading ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportDialog;
