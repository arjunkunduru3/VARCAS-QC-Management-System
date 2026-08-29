import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function WorkerDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("currentInspection");
    navigate("/");
  };
  const [chassisNo, setChassisNo] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");

  const [pendingInspections, setPendingInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(true);
  const [error, setError] = useState("");
  const [reworkMessage, setReworkMessage] = useState("");

  // Load pending inspections
  const loadPendingInspections = async () => {
    try {
      setLoadingPending(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/inspections/pending",
      );

      const data = await response.json();

      console.log("PENDING INSPECTIONS:", data);

      if (data.success) {
        setPendingInspections(data.inspections || []);
      } else {
        setError(data.message || "Failed to load pending inspections.");
      }
    } catch (error) {
      console.error("Pending inspections error:", error);
      setError("Cannot load pending inspections.");
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    loadPendingInspections();
  }, []);

  // Continue an existing pending inspection
  const continueInspection = (inspection) => {
    console.log("CONTINUING INSPECTION:", inspection);

    sessionStorage.setItem("currentInspection", JSON.stringify(inspection));

    navigate("/worker/checklist");
  };

  // Start a completely new inspection
  const startInspection = async () => {
    setError("");
    setReworkMessage("");

    if (!chassisNo.trim()) {
      setError("Please enter a chassis number.");
      return;
    }

    if (!model.trim()) {
      setError("Please enter the vehicle model.");
      return;
    }

    if (!color.trim()) {
      setError("Please enter the vehicle color.");
      return;
    }

    try {
      setLoading(true);

      const enteredChassis = chassisNo.trim();
      const enteredModel = model.trim();
      const enteredColor = color.trim();

      // Get logged-in worker
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.id) {
        setError("User login information not found. Please login again.");
        return;
      }

      console.log("LOGGED-IN USER:", user);

      // ------------------------------------------------
      // FIRST CHECK FOR REJECTED INSPECTION
      // ------------------------------------------------

      const rejectedResponse = await fetch(
        `http://localhost:5000/api/inspections/rejected/${encodeURIComponent(
          enteredChassis,
        )}`,
      );

      const rejectedData = await rejectedResponse.json();

      console.log("REJECTED INSPECTION RESPONSE:", rejectedData);

      // ------------------------------------------------
      // REJECTED INSPECTION FOUND
      // ------------------------------------------------

      if (rejectedData.success && rejectedData.found) {
        const rejectedInspection = rejectedData.inspection;

        console.log("REWORK INSPECTION FOUND:", rejectedInspection);

        const reworkResponse = await fetch(
          `http://localhost:5000/api/inspections/${rejectedInspection.id}/rework`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const reworkData = await reworkResponse.json();

        console.log("REWORK RESPONSE:", reworkData);

        if (!reworkData.success) {
          setError(reworkData.message || "Unable to start rework.");
          return;
        }

        const reworkInspection = {
          ...rejectedInspection,
          status: "IN_PROGRESS",
        };

        sessionStorage.setItem(
          "currentInspection",
          JSON.stringify(reworkInspection),
        );

        setReworkMessage(
          "Rejected inspection found. Rework inspection started.",
        );

        navigate("/worker/checklist");

        return;
      }

      // ------------------------------------------------
      // START NEW INSPECTION
      // ------------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/inspections/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chassis_no: enteredChassis,
            model: enteredModel,
            color: enteredColor,
            started_by: user.id,
          }),
        },
      );

      const data = await response.json();

      console.log("START INSPECTION RESPONSE:", data);

      if (!data.success) {
        setError(data.message || "Failed to start inspection.");
        return;
      }

      sessionStorage.setItem(
        "currentInspection",
        JSON.stringify(data.inspection),
      );

      navigate("/worker/checklist");
    } catch (error) {
      console.error("Start inspection error:", error);

      setError(
        "Cannot connect to server. Please make sure the server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "30px auto",
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 0 15px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Worker Dashboard</h1>
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
        <p
          style={{
            textAlign: "center",
            color: "gray",
            marginBottom: "35px",
          }}
        >
          VARCAS QC Management System
        </p>

        {/* ========================================= */}
        {/* PENDING INSPECTIONS */}
        {/* ========================================= */}

        <h2>Pending Inspections</h2>

        <p style={{ color: "#666" }}>
          Select an Inspection ID below to continue an existing inspection.
        </p>

        {loadingPending ? (
          <p>Loading pending inspections...</p>
        ) : pendingInspections.length === 0 ? (
          <div
            style={{
              padding: "15px",
              background: "#e8f5e9",
              color: "#2e7d32",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            No pending inspections found.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginBottom: "35px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#eef2f7",
                  }}
                >
                  <th style={tableHeaderStyle}>Inspection ID</th>
                  <th style={tableHeaderStyle}>Chassis Number</th>
                  <th style={tableHeaderStyle}>Model</th>
                  <th style={tableHeaderStyle}>Color</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {pendingInspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td style={tableCellStyle}>{inspection.id}</td>

                    <td style={tableCellStyle}>{inspection.chassis_no}</td>

                    <td style={tableCellStyle}>{inspection.model || "-"}</td>

                    <td style={tableCellStyle}>{inspection.color || "-"}</td>

                    <td
                      style={{
                        ...tableCellStyle,
                        color: "#f57c00",
                        fontWeight: "bold",
                      }}
                    >
                      {inspection.status}
                    </td>

                    <td style={tableCellStyle}>
                      <button
                        type="button"
                        onClick={() => continueInspection(inspection)}
                        style={{
                          background: "#1976d2",
                          color: "white",
                          border: "none",
                          padding: "10px 18px",
                          borderRadius: "6px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        CONTINUE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================= */}
        {/* START NEW INSPECTION */}
        {/* ========================================= */}

        <div
          style={{
            borderTop: "2px solid #ddd",
            paddingTop: "30px",
          }}
        >
          <h2>Start New Inspection</h2>

          <p style={{ color: "#666" }}>
            Enter the vehicle details to start a completely new inspection.
          </p>

          {/* Chassis Number */}
          <label>
            <strong>Enter Chassis Number</strong>
          </label>

          <input
            type="text"
            value={chassisNo}
            onChange={(e) => setChassisNo(e.target.value)}
            placeholder="Enter chassis number"
            style={inputStyle}
          />

          {/* Model */}
          <label>
            <strong>Enter Model</strong>
          </label>

          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Enter vehicle model"
            style={inputStyle}
          />

          {/* Color */}
          <label>
            <strong>Enter Color</strong>
          </label>

          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Enter vehicle color"
            style={inputStyle}
          />

          {reworkMessage && (
            <div
              style={{
                background: "#fff3cd",
                color: "#856404",
                padding: "12px",
                marginBottom: "20px",
                borderRadius: "6px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              🔧 {reworkMessage}
            </div>
          )}

          {error && (
            <p
              style={{
                color: "red",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={startInspection}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#999" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Checking Inspection..." : "START NEW INSPECTION"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "20px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const tableHeaderStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  textAlign: "left",
};

const tableCellStyle = {
  border: "1px solid #ddd",
  padding: "12px",
};

export default WorkerDashboard;
