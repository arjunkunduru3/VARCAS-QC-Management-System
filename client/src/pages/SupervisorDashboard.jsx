import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SupervisorDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("currentInspection");
    navigate("/");
  };
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/supervisor/inspections",
      );

      const data = await response.json();

      if (data.success) {
        setInspections(data.inspections || []);
      } else {
        setError(data.message || "Failed to load inspections");
      }
    } catch (error) {
      console.error("Supervisor inspections error:", error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const viewInspection = async (inspection) => {
    try {
      setLoadingDetails(true);
      setError("");

      setSelectedInspection(inspection);

      const checklistResponse = await fetch(
        "http://localhost:5000/api/checklist/quality",
      );

      const checklistData = await checklistResponse.json();

      if (!checklistData.success) {
        setError("Failed to load checklist");
        return;
      }

      setItems(checklistData.items || []);

      const resultsResponse = await fetch(
        `http://localhost:5000/api/inspection-results/${inspection.id}`,
      );

      const resultsData = await resultsResponse.json();

      if (!resultsData.success) {
        setError("Failed to load inspection results");
        return;
      }

      const savedResults = {};

      resultsData.results.forEach((row) => {
        savedResults[row.checklist_item_id] = {
          result: row.result,
          remarks: row.remarks,
          checked_by: row.checked_by,
          checked_at: row.checked_at,
        };
      });

      setResults(savedResults);
    } catch (error) {
      console.error("View inspection error:", error);
      setError("Failed to load inspection details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const backToList = () => {
    setSelectedInspection(null);
    setItems([]);
    setResults({});
    setError("");
  };

  // APPROVE INSPECTION
  const approveInspection = async () => {
    if (!selectedInspection) return;

    const confirmed = window.confirm(
      "Are you sure you want to APPROVE this inspection?",
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const response = await fetch(
        `http://localhost:5000/api/supervisor/inspections/${selectedInspection.id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      console.log("APPROVE RESPONSE:", data);

      if (data.success) {
        alert("Inspection approved successfully.");

        const updatedInspection = {
          ...selectedInspection,
          status: "REVIEWED",
        };

        setSelectedInspection(updatedInspection);

        setInspections((previous) =>
          previous.map((inspection) =>
            inspection.id === selectedInspection.id
              ? updatedInspection
              : inspection,
          ),
        );
      } else {
        alert(data.message || "Failed to approve inspection.");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Unable to approve inspection.");
    } finally {
      setProcessing(false);
    }
  };

  // REJECT INSPECTION
  const rejectInspection = async () => {
    if (!selectedInspection) return;

    const confirmed = window.confirm(
      "Are you sure you want to REJECT this inspection?",
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const response = await fetch(
        `http://localhost:5000/api/supervisor/inspections/${selectedInspection.id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      console.log("REJECT RESPONSE:", data);

      if (data.success) {
        alert("Inspection rejected successfully.");

        const updatedInspection = {
          ...selectedInspection,
          status: "REJECTED",
        };

        setSelectedInspection(updatedInspection);

        setInspections((previous) =>
          previous.map((inspection) =>
            inspection.id === selectedInspection.id
              ? updatedInspection
              : inspection,
          ),
        );
      } else {
        alert(data.message || "Failed to reject inspection.");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Unable to reject inspection.");
    } finally {
      setProcessing(false);
    }
  };

  const passCount = Object.values(results).filter(
    (item) => item.result === "PASS",
  ).length;

  const failCount = Object.values(results).filter(
    (item) => item.result === "FAIL",
  ).length;

  // FILTER INSPECTIONS
  const filteredInspections =
    activeFilter === "ALL"
      ? inspections
      : inspections.filter((inspection) => inspection.status === activeFilter);

  const pendingCount = inspections.filter(
    (inspection) => inspection.status === "COMPLETED",
  ).length;

  const rejectedCount = inspections.filter(
    (inspection) => inspection.status === "REJECTED",
  ).length;

  const reviewedCount = inspections.filter(
    (inspection) => inspection.status === "REVIEWED",
  ).length;

  // ----------------------------------------
  // INSPECTION DETAILS
  // ----------------------------------------
  if (selectedInspection) {
    return (
      <div
        style={{
          padding: "30px",
          fontFamily: "Arial, sans-serif",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={backToList}
          style={{
            background: "#555",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back to Inspections
        </button>

        <h1>Inspection Details</h1>

        <div
          style={{
            background: "#f0f4f8",
            padding: "18px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <strong>Inspection ID:</strong> {selectedInspection.id}
          <br />
          <strong>Chassis Number:</strong> {selectedInspection.chassis_no}
          <br />
          <strong>Model:</strong> {selectedInspection.model}
          <br />
          <strong>Color:</strong> {selectedInspection.color}
          <br />
          <strong>Status:</strong>{" "}
          <span
            style={{
              color:
                selectedInspection.status === "REVIEWED"
                  ? "green"
                  : selectedInspection.status === "REJECTED"
                    ? "red"
                    : "#1976d2",
              fontWeight: "bold",
            }}
          >
            {selectedInspection.status}
          </span>
        </div>

        {loadingDetails ? (
          <p>Loading inspection results...</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: "20px",
                marginBottom: "25px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "15px 25px",
                  background: "#e8f5e9",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                ✓ PASS: {passCount}
              </div>

              <div
                style={{
                  padding: "15px 25px",
                  background: "#ffebee",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                ✗ FAIL: {failCount}
              </div>

              <div
                style={{
                  padding: "15px 25px",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                TOTAL: {items.length}
              </div>
            </div>

            {/* SUPERVISOR ACTIONS */}
            {selectedInspection.status === "COMPLETED" && (
              <div
                style={{
                  marginBottom: "30px",
                  padding: "20px",
                  background: "#fff8e1",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              >
                <h2>Supervisor Review</h2>

                <p>
                  Please review all {items.length} checklist items before making
                  a decision.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={approveInspection}
                    disabled={processing}
                    style={{
                      background: processing ? "#999" : "#2e7d32",
                      color: "white",
                      border: "none",
                      padding: "12px 25px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer",
                    }}
                  >
                    {processing ? "Processing..." : "✓ APPROVE"}
                  </button>

                  <button
                    type="button"
                    onClick={rejectInspection}
                    disabled={processing}
                    style={{
                      background: processing ? "#999" : "#c62828",
                      color: "white",
                      border: "none",
                      padding: "12px 25px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer",
                    }}
                  >
                    {processing ? "Processing..." : "✗ REJECT"}
                  </button>
                </div>
              </div>
            )}

            {selectedInspection.status === "REVIEWED" && (
              <div
                style={{
                  padding: "18px",
                  marginBottom: "25px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                ✓ Inspection has been APPROVED by the supervisor.
              </div>
            )}

            {selectedInspection.status === "REJECTED" && (
              <div
                style={{
                  padding: "18px",
                  marginBottom: "25px",
                  background: "#ffebee",
                  color: "#c62828",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                ✗ Inspection has been REJECTED by the supervisor.
                <br />
                <span
                  style={{
                    fontWeight: "normal",
                    fontSize: "14px",
                  }}
                >
                  Worker must perform rework before this inspection can be
                  reviewed again.
                </span>
              </div>
            )}

            <h2>Quality Check List</h2>

            <div
              style={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "15px",
                }}
              >
                <thead>
                  <tr>
                    <th style={headerStyle}>No.</th>
                    <th style={headerStyle}>Checklist Item</th>
                    <th style={headerStyle}>Expected Value</th>
                    <th style={headerStyle}>Result</th>
                    <th style={headerStyle}>Remarks</th>
                    <th style={headerStyle}>Checked By</th>
                    <th style={headerStyle}>Checked At</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const itemResult = results[item.id];

                    return (
                      <tr key={item.id}>
                        <td style={cellStyle}>{item.item_number}</td>

                        <td style={cellStyle}>{item.description}</td>

                        <td style={cellStyle}>{item.expected_value || "-"}</td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight: "bold",
                            color:
                              itemResult?.result === "PASS"
                                ? "green"
                                : itemResult?.result === "FAIL"
                                  ? "red"
                                  : "#777",
                          }}
                        >
                          {itemResult?.result === "PASS"
                            ? "✓ PASS"
                            : itemResult?.result === "FAIL"
                              ? "✗ FAIL"
                              : "NOT CHECKED"}
                        </td>

                        <td style={cellStyle}>{itemResult?.remarks || "-"}</td>

                        <td style={cellStyle}>
                          {itemResult?.checked_by || "-"}
                        </td>

                        <td style={cellStyle}>
                          {itemResult?.checked_at || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------
  // SUPERVISOR DASHBOARD
  // ----------------------------------------
  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h1>Supervisor Dashboard</h1>
      <div style={{ textAlign: "right", marginBottom: "20px" }}>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>
      <p style={{ color: "#666" }}>VARCAS QC Management System</p>

      {/* REFRESH */}
      <button
        type="button"
        onClick={loadInspections}
        disabled={loading}
        style={{
          background: "#1976d2",
          color: "white",
          border: "none",
          padding: "10px 18px",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "25px",
        }}
      >
        {loading ? "Refreshing..." : "↻ Refresh Inspections"}
      </button>

      {/* STATUS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* ALL */}
        <div
          onClick={() => setActiveFilter("ALL")}
          style={{
            padding: "22px",
            background: activeFilter === "ALL" ? "#e3f2fd" : "#f5f5f5",
            borderRadius: "10px",
            border:
              activeFilter === "ALL" ? "2px solid #1976d2" : "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>ALL INSPECTIONS</div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginTop: "8px",
            }}
          >
            {inspections.length}
          </div>
        </div>

        {/* PENDING */}
        <div
          onClick={() => setActiveFilter("COMPLETED")}
          style={{
            padding: "22px",
            background: activeFilter === "COMPLETED" ? "#fff8e1" : "#fffdf5",
            borderRadius: "10px",
            border:
              activeFilter === "COMPLETED"
                ? "2px solid #f9a825"
                : "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "14px", color: "#8a6d00" }}>
            🟡 PENDING REVIEW
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginTop: "8px",
              color: "#f57f17",
            }}
          >
            {pendingCount}
          </div>
        </div>

        {/* REWORK */}
        <div
          onClick={() => setActiveFilter("REJECTED")}
          style={{
            padding: "22px",
            background: activeFilter === "REJECTED" ? "#ffebee" : "#fffafa",
            borderRadius: "10px",
            border:
              activeFilter === "REJECTED"
                ? "2px solid #c62828"
                : "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "14px", color: "#c62828" }}>
            🔴 REWORK REQUIRED
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginTop: "8px",
              color: "#c62828",
            }}
          >
            {rejectedCount}
          </div>
        </div>

        {/* APPROVED */}
        <div
          onClick={() => setActiveFilter("REVIEWED")}
          style={{
            padding: "22px",
            background: activeFilter === "REVIEWED" ? "#e8f5e9" : "#fbfffb",
            borderRadius: "10px",
            border:
              activeFilter === "REVIEWED"
                ? "2px solid #2e7d32"
                : "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "14px", color: "#2e7d32" }}>🟢 APPROVED</div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginTop: "8px",
              color: "#2e7d32",
            }}
          >
            {reviewedCount}
          </div>
        </div>
      </div>

      {/* CURRENT FILTER */}
      <div
        style={{
          marginBottom: "20px",
          padding: "12px 15px",
          background: "#f5f5f5",
          borderRadius: "6px",
        }}
      >
        <strong>Showing: </strong>

        {activeFilter === "ALL" && "All Inspections"}
        {activeFilter === "COMPLETED" && "Pending Supervisor Review"}
        {activeFilter === "REJECTED" && "Rework Required"}
        {activeFilter === "REVIEWED" && "Approved Inspections"}
      </div>

      {loading && <p>Loading inspections...</p>}

      {error && (
        <p
          style={{
            color: "red",
            fontWeight: "bold",
            background: "#ffebee",
            padding: "12px",
            borderRadius: "6px",
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && filteredInspections.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          No inspections found for this category.
        </div>
      )}

      {!loading && !error && filteredInspections.length > 0 && (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr>
                <th style={headerStyle}>Inspection ID</th>
                <th style={headerStyle}>Chassis Number</th>
                <th style={headerStyle}>Model</th>
                <th style={headerStyle}>Color</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={cellStyle}>{inspection.id}</td>

                  <td style={cellStyle}>{inspection.chassis_no}</td>

                  <td style={cellStyle}>{inspection.model}</td>

                  <td style={cellStyle}>{inspection.color}</td>

                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: "bold",
                      color:
                        inspection.status === "REVIEWED"
                          ? "#2e7d32"
                          : inspection.status === "REJECTED"
                            ? "#c62828"
                            : "#f57f17",
                    }}
                  >
                    {inspection.status === "COMPLETED"
                      ? "🟡 PENDING REVIEW"
                      : inspection.status === "REJECTED"
                        ? "🔴 REWORK REQUIRED"
                        : inspection.status === "REVIEWED"
                          ? "🟢 APPROVED"
                          : inspection.status}
                  </td>

                  <td style={cellStyle}>
                    <button
                      type="button"
                      onClick={() => viewInspection(inspection)}
                      style={{
                        background:
                          inspection.status === "REVIEWED"
                            ? "#2e7d32"
                            : inspection.status === "REJECTED"
                              ? "#c62828"
                              : "#1976d2",
                        color: "white",
                        border: "none",
                        padding: "8px 15px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      View Inspection
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  border: "1px solid #ccc",
  padding: "12px",
  background: "#f0f4f8",
  textAlign: "left",
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left",
};

export default SupervisorDashboard;
