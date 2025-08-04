import React from "react";

function ProviderResultList({
  results,
  expandedIdx,
  setExpandedIdx,
  selectedProviderIdx,
  handleProviderSelect
}) {
  if (!results || results.length === 0) {
    return <div style={{ color: "#888" }}>No results yet. Please calculate to see providers and charges.</div>;
  }
  // ...existing code for rendering provider results list...
}

export default ProviderResultList;
