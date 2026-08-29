import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("currentInspection");
    navigate("/");
  };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState({
    section_id: 1,
    item_number: "",
    description: "",
    expected_value: "",
    display_order: "",
  });

  // ======================================================
  // LOAD CHECKLIST
  // ======================================================

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/admin/checklist");

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to load checklist.");
        return;
      }

      setItems(data.items);
    } catch (error) {
      console.error("Load checklist error:", error);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, []);

  // ======================================================
  // UPDATE ITEM LOCALLY
  // ======================================================

  const updateItem = (id, field, value) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  // ======================================================
  // SAVE ITEM
  // ======================================================

  const saveItem = async (item) => {
    try {
      setSavingId(item.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/admin/checklist/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item_number: Number(item.item_number),
            description: item.description,
            expected_value: item.expected_value,
            display_order: Number(item.display_order),
            active: Boolean(item.active),
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to save item.");
        return;
      }

      setMessage(`Item ${item.item_number} saved successfully.`);

      await loadChecklist();
    } catch (error) {
      console.error("Save item error:", error);
      setError("Cannot connect to server.");
    } finally {
      setSavingId(null);
    }
  };

  // ======================================================
  // ADD NEW ITEM
  // ======================================================

  const addItem = async () => {
    setError("");
    setMessage("");

    if (!newItem.item_number || !newItem.description.trim()) {
      setError("Item number and description are required.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/checklist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section_id: Number(newItem.section_id),
            item_number: Number(newItem.item_number),
            description: newItem.description.trim(),
            expected_value: newItem.expected_value.trim(),
            display_order:
              Number(newItem.display_order) || Number(newItem.item_number),
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to add item.");
        return;
      }

      setMessage("New checklist item added successfully.");

      setNewItem({
        section_id: 1,
        item_number: "",
        description: "",
        expected_value: "",
        display_order: "",
      });

      setShowAddForm(false);

      await loadChecklist();
    } catch (error) {
      console.error("Add item error:", error);
      setError("Cannot connect to server.");
    }
  };

  // ======================================================
  // DEACTIVATE ITEM
  // ======================================================

  const deactivateItem = async (item) => {
    const confirmDeactivate = window.confirm(
      `Are you sure you want to deactivate Item ${item.item_number}?`,
    );

    if (!confirmDeactivate) {
      return;
    }

    await saveItem({
      ...item,
      active: false,
    });
  };

  // ======================================================
  // REACTIVATE ITEM
  // ======================================================

  const reactivateItem = async (item) => {
    await saveItem({
      ...item,
      active: true,
    });
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          fontFamily: "Arial",
        }}
      >
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 25px",
          background: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div style={{ textAlign: "right", marginTop: "15px" }}>
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
        <p style={{ color: "gray", marginBottom: 0 }}>
          VARCAS AUTOMOBILES — QC Management System
        </p>
      </div>

      {/* MESSAGES */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 20px",
        }}
      >
        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "12px",
              borderRadius: "6px",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* CHECKLIST CONTAINER */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* TITLE + ADD BUTTON */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Quality Check List</h2>

            <p style={{ color: "gray" }}>
              Total Items: <strong>{items.length}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "12px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            {showAddForm ? "✖ Cancel" : "➕ Add New Item"}
          </button>
        </div>

        {/* ADD ITEM FORM */}

        {showAddForm && (
          <div
            style={{
              background: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "25px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add New Checklist Item</h3>

            <label>
              <strong>Section</strong>
            </label>

            <select
              value={newItem.section_id}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  section_id: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
              }}
            >
              <option value="1">Mechanical & Physical Checks</option>
              <option value="2">Electrical & Functional Checks</option>
            </select>

            <label>
              <strong>Item Number</strong>
            </label>

            <input
              type="number"
              value={newItem.item_number}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  item_number: e.target.value,
                })
              }
              placeholder="Example: 58"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <label>
              <strong>Description</strong>
            </label>

            <textarea
              value={newItem.description}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  description: e.target.value,
                })
              }
              placeholder="Enter checklist item description"
              rows="3"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <label>
              <strong>Expected Value</strong>
            </label>

            <input
              type="text"
              value={newItem.expected_value}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  expected_value: e.target.value,
                })
              }
              placeholder="Example: Working properly"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <label>
              <strong>Display Order</strong>
            </label>

            <input
              type="number"
              value={newItem.display_order}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  display_order: e.target.value,
                })
              }
              placeholder="Example: 58"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "20px",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={addItem}
              style={{
                padding: "12px 25px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              💾 Add Item
            </button>
          </div>
        )}

        {/* CHECKLIST ITEMS */}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "18px",
              marginBottom: "15px",
              background: item.active ? "white" : "#eeeeee",
            }}
          >
            {/* TOP ROW */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <strong>
                Item {item.item_number} — {item.section_name}
              </strong>

              {item.active ? (
                <button
                  type="button"
                  onClick={() => deactivateItem(item)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  🚫 Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => reactivateItem(item)}
                  style={{
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  ✅ Reactivate
                </button>
              )}
            </div>

            {/* ITEM NUMBER */}

            <label>
              <strong>Item Number</strong>
            </label>

            <input
              type="number"
              value={item.item_number}
              onChange={(e) =>
                updateItem(item.id, "item_number", e.target.value)
              }
              style={{
                width: "100px",
                padding: "8px",
                marginTop: "5px",
                marginBottom: "15px",
              }}
            />

            {/* DESCRIPTION */}

            <label>
              <strong>Description</strong>
            </label>

            <textarea
              value={item.description}
              onChange={(e) =>
                updateItem(item.id, "description", e.target.value)
              }
              rows="2"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            {/* EXPECTED VALUE */}

            <label>
              <strong>Expected Value</strong>
            </label>

            <input
              type="text"
              value={item.expected_value || ""}
              onChange={(e) =>
                updateItem(item.id, "expected_value", e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            {/* DISPLAY ORDER */}

            <label>
              <strong>Display Order</strong>
            </label>

            <input
              type="number"
              value={item.display_order}
              onChange={(e) =>
                updateItem(item.id, "display_order", e.target.value)
              }
              style={{
                width: "100px",
                padding: "8px",
                marginTop: "5px",
                marginBottom: "15px",
              }}
            />

            {/* SAVE BUTTON */}

            <br />

            <button
              type="button"
              onClick={() => saveItem(item)}
              disabled={savingId === item.id}
              style={{
                padding: "10px 20px",
                background: savingId === item.id ? "#999" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: savingId === item.id ? "not-allowed" : "pointer",
              }}
            >
              {savingId === item.id ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
