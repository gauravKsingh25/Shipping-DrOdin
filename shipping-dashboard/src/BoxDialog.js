import React, { useEffect, useState } from "react";

function BoxDialog({ open, onClose, onAdd, boxToDuplicate }) {
  const [formData, setFormData] = useState({
    length: "",
    breadth: "",
    height: "",
    deadWeight: "",
    quantity: "1"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (boxToDuplicate) {
        // When duplicating, pre-fill the form with existing box data
        setFormData({
          length: boxToDuplicate.length.toString(),
          breadth: boxToDuplicate.breadth.toString(),
          height: boxToDuplicate.height.toString(),
          deadWeight: boxToDuplicate.deadWeight.toString(),
          quantity: boxToDuplicate.quantity.toString()
        });
      } else {
        // Reset form for new box
        setFormData({
          length: "",
          breadth: "",
          height: "",
          deadWeight: "",
          quantity: "1"
        });
      }
      setErrors({});
    }
  }, [open, boxToDuplicate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.length || parseFloat(formData.length) <= 0) {
      newErrors.length = "Length must be greater than 0";
    }
    if (!formData.breadth || parseFloat(formData.breadth) <= 0) {
      newErrors.breadth = "Breadth must be greater than 0";
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = "Height must be greater than 0";
    }
    if (!formData.deadWeight || parseFloat(formData.deadWeight) <= 0) {
      newErrors.deadWeight = "Dead weight must be greater than 0";
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const boxData = {
      length: parseFloat(formData.length),
      breadth: parseFloat(formData.breadth),
      height: parseFloat(formData.height),
      deadWeight: parseFloat(formData.deadWeight),
      quantity: parseInt(formData.quantity)
    };

    onAdd(boxData);
  };

  const handleClose = () => {
    setFormData({
      length: "",
      breadth: "",
      height: "",
      deadWeight: "",
      quantity: "1"
    });
    setErrors({});
    onClose();
  };

  if (!open) return null;

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
      onClick={handleClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "2rem",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "1.5rem", color: "#2d3748" }}>
          {boxToDuplicate ? "Update Box Quantity" : "Add New Box"}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Length (cm)
              </label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => handleInputChange("length", e.target.value)}
                disabled={!!boxToDuplicate}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${errors.length ? "#e53e3e" : "#e2e8f0"}`,
                  borderRadius: "6px",
                  backgroundColor: boxToDuplicate ? "#f7fafc" : "#fff"
                }}
                step="0.1"
                min="0"
              />
              {errors.length && (
                <span style={{ color: "#e53e3e", fontSize: "0.875rem" }}>{errors.length}</span>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Breadth (cm)
              </label>
              <input
                type="number"
                value={formData.breadth}
                onChange={(e) => handleInputChange("breadth", e.target.value)}
                disabled={!!boxToDuplicate}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${errors.breadth ? "#e53e3e" : "#e2e8f0"}`,
                  borderRadius: "6px",
                  backgroundColor: boxToDuplicate ? "#f7fafc" : "#fff"
                }}
                step="0.1"
                min="0"
              />
              {errors.breadth && (
                <span style={{ color: "#e53e3e", fontSize: "0.875rem" }}>{errors.breadth}</span>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                disabled={!!boxToDuplicate}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${errors.height ? "#e53e3e" : "#e2e8f0"}`,
                  borderRadius: "6px",
                  backgroundColor: boxToDuplicate ? "#f7fafc" : "#fff"
                }}
                step="0.1"
                min="0"
              />
              {errors.height && (
                <span style={{ color: "#e53e3e", fontSize: "0.875rem" }}>{errors.height}</span>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Dead Weight (kg)
              </label>
              <input
                type="number"
                value={formData.deadWeight}
                onChange={(e) => handleInputChange("deadWeight", e.target.value)}
                disabled={!!boxToDuplicate}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${errors.deadWeight ? "#e53e3e" : "#e2e8f0"}`,
                  borderRadius: "6px",
                  backgroundColor: boxToDuplicate ? "#f7fafc" : "#fff"
                }}
                step="0.1"
                min="0"
              />
              {errors.deadWeight && (
                <span style={{ color: "#e53e3e", fontSize: "0.875rem" }}>{errors.deadWeight}</span>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: `1px solid ${errors.quantity ? "#e53e3e" : "#e2e8f0"}`,
                  borderRadius: "6px"
                }}
                min="1"
              />
              {errors.quantity && (
                <span style={{ color: "#e53e3e", fontSize: "0.875rem" }}>{errors.quantity}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "none",
                borderRadius: "6px",
                background: "#007bff",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {boxToDuplicate ? "Update" : "Add Box"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BoxDialog;
