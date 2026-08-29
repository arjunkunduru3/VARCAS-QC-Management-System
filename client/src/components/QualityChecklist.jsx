import { useEffect, useRef, useState } from "react";

function QualityChecklist() {
  const [items, setItems] = useState([]);
  const [results, setResults] = useState({});
  const [inspection, setInspection] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  const clickCount = useRef({});
  const clickTimer = useRef({});

  // Load current inspection, checklist and saved results
  useEffect(() => {
    const savedInspection = sessionStorage.getItem("currentInspection");

    if (!savedInspection) {
      console.error("No current inspection found.");
      return;
    }

    const inspectionData = JSON.parse(savedInspection);

    console.log("CURRENT INSPECTION:", inspectionData);

    setInspection(inspectionData);

    // Load checklist
    fetch("http://localhost:5000/api/checklist/quality")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setItems(data.items);
          console.log("CHECKLIST LOADED:", data.items);
        }
      })
      .catch((error) => {
        console.error("Error loading checklist:", error);
      });

    // Load saved results for this inspection
    fetch(`http://localhost:5000/api/inspection-results/${inspectionData.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const savedResults = {};

          data.results.forEach((row) => {
            savedResults[row.checklist_item_id] = row.result;
          });

          setResults(savedResults);

          console.log("SAVED RESULTS LOADED:", savedResults);
        }
      })
      .catch((error) => {
        console.error("Error loading saved results:", error);
      });

    return () => {
      Object.values(clickTimer.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  // Save checklist result to MySQL
  const saveResult = async (itemId, result) => {
    if (!inspection?.id) {
      console.error("No active inspection found.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      console.error("Logged-in user information not found.");
      alert("User login information not found. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/inspection-results",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inspection_id: inspection.id,
            checklist_item_id: itemId,
            result: result,
            remarks: result === "FAIL" ? "Inspection item failed" : null,
            checked_by: result === null ? null : user.id,
          }),
        },
      );

      const data = await response.json();

      console.log("SERVER RESPONSE:", data);

      if (!data.success) {
        console.error("Save failed:", data.message);
      }
    } catch (error) {
      console.error("ERROR SAVING RESULT:", error);
    }
  };

  // Handle 1 click / 2 clicks / 3 clicks
  const handleChecklistClick = (itemId) => {
    if (inspection?.status === "COMPLETED") {
      return;
    }

    clickCount.current[itemId] = (clickCount.current[itemId] || 0) + 1;

    if (clickTimer.current[itemId]) {
      clearTimeout(clickTimer.current[itemId]);
    }

    clickTimer.current[itemId] = setTimeout(() => {
      const count = clickCount.current[itemId];

      let newResult = null;

      if (count === 1) {
        newResult = "PASS";
      } else if (count === 2) {
        newResult = "FAIL";
      } else if (count >= 3) {
        newResult = null;
      }

      console.log("CHECKLIST CLICK:", itemId, "RESULT:", newResult);

      setResults((previousResults) => ({
        ...previousResults,
        [itemId]: newResult,
      }));

      saveResult(itemId, newResult);

      clickCount.current[itemId] = 0;
    }, 400);
  };

  // ------------------------------------------------
  // SELECT ALL
  // ------------------------------------------------
  const handleSelectAll = async () => {
    if (inspection?.status === "COMPLETED") {
      return;
    }

    if (items.length === 0) {
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      alert("User login information not found. Please login again.");
      return;
    }

    setSelectingAll(true);

    try {
      // Check whether all items are already PASS
      const allPassed = items.every((item) => results[item.id] === "PASS");

      // If all are PASS, clear all.
      // Otherwise, mark all as PASS.
      const newResult = allPassed ? null : "PASS";

      const updatedResults = { ...results };

      items.forEach((item) => {
        updatedResults[item.id] = newResult;
      });

      setResults(updatedResults);

      // Save every item to MySQL
      for (const item of items) {
        await saveResult(item.id, newResult);
      }

      console.log(
        allPassed
          ? "ALL CHECKLIST ITEMS CLEARED"
          : "ALL CHECKLIST ITEMS MARKED PASS",
      );
    } catch (error) {
      console.error("SELECT ALL ERROR:", error);
      alert("Unable to update all checklist items.");
    } finally {
      setSelectingAll(false);
    }
  };

  // Check whether all items are PASS
  const allItemsPassed =
    items.length > 0 && items.every((item) => results[item.id] === "PASS");

  // Complete inspection
  const completeInspection = async () => {
    if (!inspection?.id) {
      alert("No active inspection found.");
      return;
    }

    const uncheckedItems = items.filter((item) => !results[item.id]);

    if (uncheckedItems.length > 0) {
      alert(
        `Please complete all checklist items before completing the inspection.\n\nUnchecked items: ${uncheckedItems.length}`,
      );
      return;
    }

    const confirmComplete = window.confirm(
      "Are you sure you want to complete this inspection?",
    );

    if (!confirmComplete) {
      return;
    }

    try {
      setCompleting(true);

      console.log("COMPLETING INSPECTION:", inspection.id);

      const response = await fetch(
        `http://localhost:5000/api/inspections/${inspection.id}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      console.log("COMPLETE INSPECTION RESPONSE:", data);

      if (!data.success) {
        alert(data.message || "Failed to complete inspection.");
        return;
      }

      const updatedInspection = {
        ...inspection,
        status: "COMPLETED",
      };

      setInspection(updatedInspection);

      sessionStorage.setItem(
        "currentInspection",
        JSON.stringify(updatedInspection),
      );

      alert("Inspection completed successfully!");
    } catch (error) {
      console.error("ERROR COMPLETING INSPECTION:", error);

      alert("Unable to complete inspection.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        width: "100%",
        maxWidth: "1200px",
        boxSizing: "border-box",
      }}
    >
      <h1>Quality Check List</h1>

      {/* Inspection information */}
      {inspection && (
        <div
          style={{
            background: "#f0f4f8",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <strong>Chassis Number:</strong> {inspection.chassis_no}
          <br />
          <strong>Inspection ID:</strong> {inspection.id}
          <br />
          <strong>Model:</strong> {inspection.model || "Not provided"}
          <br />
          <strong>Color:</strong> {inspection.color || "Not provided"}
          <br />
          <strong>Status:</strong> {inspection.status}
        </div>
      )}

      <p>
        <strong>Total Items:</strong> {items.length}
      </p>

      <p>
        <strong>Instructions:</strong>
        <br />
        1 click = ✓ PASS
        <br />
        2 clicks = ✗ FAIL
        <br />3 clicks = □ CLEAR
      </p>

      {/* SELECT ALL */}
      {inspection?.status !== "COMPLETED" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#e3f2fd",
            border: "1px solid #90caf9",
            padding: "15px 20px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <div>
            <strong style={{ fontSize: "17px" }}>Select All</strong>

            <div
              style={{
                fontSize: "13px",
                color: "#555",
                marginTop: "4px",
              }}
            >
              {allItemsPassed
                ? "All items are PASS. Click to clear all."
                : "Click to mark all checklist items as PASS."}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSelectAll}
            disabled={selectingAll || items.length === 0}
            style={{
              width: "40px",
              height: "40px",
              fontSize: "22px",
              background: allItemsPassed ? "#2e7d32" : "white",
              color: allItemsPassed ? "white" : "black",
              border: "1px solid #777",
              borderRadius: "5px",
              cursor: selectingAll ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {selectingAll ? "..." : allItemsPassed ? "✓" : "□"}
          </button>
        </div>
      )}

      {/* Checklist */}
      <div
        style={{
          width: "100%",
        }}
      >
        {items.map((item) => {
          const result = results[item.id];

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 80px",
                width: "100%",
                minHeight: "50px",
                alignItems: "center",
                borderBottom: "1px solid #ddd",
                boxSizing: "border-box",
              }}
            >
              {/* ITEM NAME - LEFT */}
              <div
                style={{
                  textAlign: "left",
                  padding: "8px 20px 8px 0",
                  wordBreak: "break-word",
                  boxSizing: "border-box",
                }}
              >
                {item.item_number}. {item.description}
                {item.expected_value && (
                  <span> — Expected: {item.expected_value}</span>
                )}
              </div>

              {/* CHECKBOX - RIGHT */}
              <div
                style={{
                  width: "80px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleChecklistClick(item.id)}
                  disabled={inspection?.status === "COMPLETED"}
                  style={{
                    width: "40px",
                    height: "40px",
                    fontSize: "22px",
                    cursor:
                      inspection?.status === "COMPLETED"
                        ? "not-allowed"
                        : "pointer",
                    padding: "0",
                    margin: "0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {result === "PASS" && "✓"}
                  {result === "FAIL" && "✗"}
                  {!result && "□"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Inspection Button */}
      {inspection?.status !== "COMPLETED" && (
        <div
          style={{
            marginTop: "30px",
            paddingBottom: "30px",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={completeInspection}
            disabled={completing}
            style={{
              background: completing ? "#999" : "#1976d2",
              color: "white",
              border: "none",
              padding: "14px 30px",
              fontSize: "17px",
              fontWeight: "bold",
              borderRadius: "6px",
              cursor: completing ? "not-allowed" : "pointer",
            }}
          >
            {completing ? "Completing..." : "Complete Inspection"}
          </button>
        </div>
      )}

      {/* Completed message */}
      {inspection?.status === "COMPLETED" && (
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#e8f5e9",
            color: "#2e7d32",
            textAlign: "center",
            fontWeight: "bold",
            borderRadius: "6px",
          }}
        >
          ✓ Inspection Completed Successfully
        </div>
      )}
    </div>
  );
}

export default QualityChecklist;
