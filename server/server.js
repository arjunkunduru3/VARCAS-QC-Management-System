const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
// Serve React production build
app.use(express.static(path.join(__dirname, "../client/dist")));
// Handle React Router routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
}); // ======================================================
// ADMIN - CHECKLIST MANAGEMENT
// ======================================================

// Get all Quality Check List items
app.get("/api/admin/checklist", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ci.id,
        ci.section_id,
        s.name AS section_name,
        ci.item_number,
        ci.description,
        ci.expected_value,
        ci.display_order,
        ci.active
      FROM checklist_items ci
      JOIN sections s
        ON ci.section_id = s.id
      JOIN checklist_types ct
        ON s.checklist_type_id = ct.id
      WHERE ct.name = 'Quality Check List'
      ORDER BY ci.display_order, ci.item_number
    `);

    res.json({
      success: true,
      total: rows.length,
      items: rows,
    });
  } catch (error) {
    console.error("Admin checklist load error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin checklist",
    });
  }
});

// Add a new checklist item
app.post("/api/admin/checklist", async (req, res) => {
  try {
    const {
      section_id,
      item_number,
      description,
      expected_value,
      display_order,
    } = req.body;

    if (!section_id || !item_number || !description) {
      return res.status(400).json({
        success: false,
        message: "Section, item number and description are required",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO checklist_items
      (
        section_id,
        item_number,
        description,
        expected_value,
        display_order,
        active
      )
      VALUES (?, ?, ?, ?, ?, 1)
      `,
      [
        section_id,
        item_number,
        description.trim(),
        expected_value || null,
        display_order || item_number,
      ],
    );

    res.json({
      success: true,
      message: "Checklist item added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Admin checklist add error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add checklist item",
    });
  }
});

// Update a checklist item
app.put("/api/admin/checklist/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { item_number, description, expected_value, display_order, active } =
      req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    await db.query(
      `
      UPDATE checklist_items
      SET
        item_number = ?,
        description = ?,
        expected_value = ?,
        display_order = ?,
        active = ?
      WHERE id = ?
      `,
      [
        item_number,
        description.trim(),
        expected_value || null,
        display_order,
        active ? 1 : 0,
        id,
      ],
    );

    res.json({
      success: true,
      message: "Checklist item updated successfully",
    });
  } catch (error) {
    console.error("Admin checklist update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update checklist item",
    });
  }
});
// Update a checklist item
app.put("/api/admin/checklist/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { item_number, description, expected_value, display_order, active } =
      req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    await db.query(
      `
      UPDATE checklist_items
      SET
        item_number = ?,
        description = ?,
        expected_value = ?,
        display_order = ?,
        active = ?
      WHERE id = ?
      `,
      [
        item_number,
        description.trim(),
        expected_value || null,
        display_order,
        active ? 1 : 0,
        id,
      ],
    );

    res.json({
      success: true,
      message: "Checklist item updated successfully",
    });
  } catch (error) {
    console.error("Admin checklist update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update checklist item",
    });
  }
});
// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "MySQL connected successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Load Quality Check List
app.get("/api/checklist/quality", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ci.id,
        ci.item_number,
        ci.description,
        ci.expected_value,
        ci.display_order
      FROM checklist_items ci
      JOIN sections s
        ON ci.section_id = s.id
      JOIN checklist_types ct
        ON s.checklist_type_id = ct.id
      WHERE ct.name = 'Quality Check List'
        AND ct.active = TRUE
        AND s.active = TRUE
        AND ci.active = TRUE
      ORDER BY ci.item_number
    `);

    res.json({
      success: true,
      total: rows.length,
      items: rows,
    });
  } catch (error) {
    console.error("Checklist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load checklist",
    });
  }
});

// Load saved inspection results
app.get("/api/inspection-results/:inspectionId", async (req, res) => {
  try {
    const { inspectionId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        ir.checklist_item_id,
        ir.result,
        ir.remarks,
        ir.checked_by,
        ir.checked_at
      FROM inspection_results ir
      WHERE ir.inspection_id = ?
      `,
      [inspectionId],
    );

    res.json({
      success: true,
      results: rows,
    });
  } catch (error) {
    console.error("Load inspection results error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load inspection results",
    });
  }
});

// Save inspection result
app.put("/api/inspection-results", async (req, res) => {
  try {
    const { inspection_id, checklist_item_id, result, remarks, checked_by } =
      req.body;

    console.log("RECEIVED FROM REACT:", req.body);

    if (result !== null && result !== "PASS" && result !== "FAIL") {
      return res.status(400).json({
        success: false,
        message: "Invalid result",
      });
    }

    const [updateResult] = await db.query(
      `
      UPDATE inspection_results
      SET
        result = ?,
        remarks = ?,
        checked_by = ?,
        checked_at = CASE
          WHEN ? IS NULL THEN NULL
          ELSE CURRENT_TIMESTAMP
        END
      WHERE inspection_id = ?
        AND checklist_item_id = ?
      `,
      [
        result,
        remarks || null,
        result === null ? null : checked_by,
        result,
        inspection_id,
        checklist_item_id,
      ],
    );

    console.log("ROWS UPDATED:", updateResult.affectedRows);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection result not found",
      });
    }

    res.json({
      success: true,
      message:
        result === null ? "Checklist item cleared" : "Checklist result saved",
    });
  } catch (error) {
    console.error("Save result error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save checklist result",
    });
  }
});

// Login API
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password and role are required",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        username,
        password,
        role
      FROM users
      WHERE username = ?
        AND role = ?
      LIMIT 1
      `,
      [username, role],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or role",
      });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Signup API
app.post("/api/signup", async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["worker", "admin", "supervisor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO users
        (name, username, password, role)
      VALUES
        (?, ?, ?, ?)
      `,
      [name, username, password, role],
    );

    res.json({
      success: true,
      message: "Account created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
});

// Supervisor - Load completed inspections
app.get("/api/supervisor/inspections", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.id,
        i.vehicle_id,
        i.checklist_type_id,
        i.started_by,
        i.status,
        v.chassis_no,
        v.model,
        v.color
      FROM inspections i
      JOIN vehicles v
        ON i.vehicle_id = v.id
      
      ORDER BY i.id DESC
    `);

    console.log("SUPERVISOR INSPECTIONS:", rows);

    res.json({
      success: true,
      inspections: rows,
    });
  } catch (error) {
    console.error("Supervisor inspections error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load supervisor inspections",
    });
  }
});
// Get pending inspections for worker
app.get("/api/inspections/pending", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.id,
        i.vehicle_id,
        i.checklist_type_id,
        i.started_by,
        i.status,
        v.chassis_no,
        v.model,
        v.color
      FROM inspections i
      JOIN vehicles v
        ON i.vehicle_id = v.id
      WHERE i.status = 'IN_PROGRESS'
      ORDER BY i.id DESC
    `);

    res.json({
      success: true,
      inspections: rows,
    });
  } catch (error) {
    console.error("Pending inspections error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load pending inspections",
    });
  }
});

// Start a new inspection
app.post("/api/inspections/start", async (req, res) => {
  try {
    const { chassis_no, model, color, started_by } = req.body;

    if (!chassis_no || !model || !color) {
      return res.status(400).json({
        success: false,
        message: "Chassis number, model and color are required",
      });
    }

    // ------------------------------------------------
    // CHECK WHETHER VEHICLE ALREADY EXISTS
    // ------------------------------------------------

    let [vehicles] = await db.query(
      `
      SELECT id, chassis_no, model, color
      FROM vehicles
      WHERE chassis_no = ?
      `,
      [chassis_no],
    );

    let vehicle;

    // ------------------------------------------------
    // EXISTING VEHICLE
    // ------------------------------------------------

    if (vehicles.length > 0) {
      vehicle = vehicles[0];

      // Update model and color with the values entered
      // by the worker.
      await db.query(
        `
        UPDATE vehicles
        SET model = ?, color = ?
        WHERE id = ?
        `,
        [model, color, vehicle.id],
      );

      vehicle = {
        ...vehicle,
        model: model,
        color: color,
      };
    }

    // ------------------------------------------------
    // NEW VEHICLE
    // ------------------------------------------------
    else {
      const [vehicleResult] = await db.query(
        `
        INSERT INTO vehicles
          (chassis_no, model, color)
        VALUES
          (?, ?, ?)
        `,
        [chassis_no, model, color],
      );

      vehicle = {
        id: vehicleResult.insertId,
        chassis_no: chassis_no,
        model: model,
        color: color,
      };
    }

    // ------------------------------------------------
    // GET QUALITY CHECK LIST TYPE
    // ------------------------------------------------

    const [checklistTypes] = await db.query(
      `
      SELECT id
      FROM checklist_types
      WHERE name = 'Quality Check List'
        AND active = TRUE
      LIMIT 1
      `,
    );

    if (checklistTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quality Check List not found",
      });
    }

    const checklistTypeId = checklistTypes[0].id;

    // ------------------------------------------------
    // CREATE NEW INSPECTION
    // ------------------------------------------------

    const [inspectionResult] = await db.query(
      `
      INSERT INTO inspections
        (vehicle_id, checklist_type_id, started_by, status)
      VALUES
        (?, ?, ?, 'IN_PROGRESS')
      `,
      [vehicle.id, checklistTypeId, started_by || null],
    );

    const inspectionId = inspectionResult.insertId;

    // ------------------------------------------------
    // CREATE EMPTY CHECKLIST RESULTS
    // ------------------------------------------------

    await db.query(
      `
      INSERT INTO inspection_results
        (inspection_id, checklist_item_id, result)
      SELECT
        ?,
        ci.id,
        NULL
      FROM checklist_items ci
      JOIN sections s
        ON ci.section_id = s.id
      WHERE s.checklist_type_id = ?
        AND ci.active = TRUE
      `,
      [inspectionId, checklistTypeId],
    );

    // ------------------------------------------------
    // SEND INSPECTION TO REACT
    // ------------------------------------------------

    res.json({
      success: true,
      message: "Inspection started successfully",
      inspection: {
        id: inspectionId,
        vehicle_id: vehicle.id,
        chassis_no: vehicle.chassis_no,
        model: vehicle.model,
        color: vehicle.color,
        checklist_type_id: checklistTypeId,
        status: "IN_PROGRESS",
      },
    });
  } catch (error) {
    console.error("Start inspection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to start inspection",
    });
  }
});
// Complete inspection
app.put("/api/inspections/complete", async (req, res) => {
  try {
    const { inspection_id } = req.body;

    console.log("COMPLETING INSPECTION:", inspection_id);

    if (!inspection_id) {
      return res.status(400).json({
        success: false,
        message: "Inspection ID is required",
      });
    }

    const [updateResult] = await db.query(
      `
      UPDATE inspections
      SET status = 'COMPLETED'
      WHERE id = ?
        AND status = 'IN_PROGRESS'
      `,
      [inspection_id],
    );

    console.log("INSPECTION ROWS UPDATED:", updateResult.affectedRows);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found or inspection is already completed",
      });
    }

    res.json({
      success: true,
      message: "Inspection completed successfully",
    });
  } catch (error) {
    console.error("Complete inspection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to complete inspection",
    });
  }
});

// Complete an inspection with validation
app.put("/api/inspections/:inspectionId/complete", async (req, res) => {
  try {
    const { inspectionId } = req.params;

    console.log("COMPLETING INSPECTION:", inspectionId);

    const [inspections] = await db.query(
      `
      SELECT id, status
      FROM inspections
      WHERE id = ?
      `,
      [inspectionId],
    );

    if (inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }

    const [unchecked] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM inspection_results
      WHERE inspection_id = ?
        AND result IS NULL
      `,
      [inspectionId],
    );

    if (unchecked[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `There are ${unchecked[0].count} unchecked checklist items`,
      });
    }

    const [updateResult] = await db.query(
      `
      UPDATE inspections
      SET status = 'COMPLETED'
      WHERE id = ?
      `,
      [inspectionId],
    );

    console.log("INSPECTION COMPLETED:", inspectionId);
    console.log("ROWS UPDATED:", updateResult.affectedRows);

    res.json({
      success: true,
      message: "Inspection completed successfully",
      inspection_id: Number(inspectionId),
      status: "COMPLETED",
    });
  } catch (error) {
    console.error("Complete inspection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to complete inspection",
    });
  }
});
// Supervisor - Approve inspection
app.put(
  "/api/supervisor/inspections/:inspectionId/approve",
  async (req, res) => {
    try {
      const { inspectionId } = req.params;

      console.log("APPROVING INSPECTION:", inspectionId);

      const [updateResult] = await db.query(
        `
      UPDATE inspections
      SET status = 'REVIEWED'
      WHERE id = ?
        AND status = 'COMPLETED'
      `,
        [inspectionId],
      );

      console.log("APPROVE ROWS UPDATED:", updateResult.affectedRows);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Inspection not found or inspection is not completed",
        });
      }

      res.json({
        success: true,
        message: "Inspection approved successfully",
        inspection_id: Number(inspectionId),
        status: "REVIEWED",
      });
    } catch (error) {
      console.error("Approve inspection error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to approve inspection",
      });
    }
  },
);

// Supervisor - Reject inspection
app.put(
  "/api/supervisor/inspections/:inspectionId/reject",
  async (req, res) => {
    try {
      const { inspectionId } = req.params;

      console.log("REJECTING INSPECTION:", inspectionId);

      const [updateResult] = await db.query(
        `
      UPDATE inspections
      SET status = 'REJECTED'
      WHERE id = ?
        AND status = 'COMPLETED'
      `,
        [inspectionId],
      );

      console.log("REJECT ROWS UPDATED:", updateResult.affectedRows);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Inspection not found or inspection is not completed",
        });
      }

      res.json({
        success: true,
        message: "Inspection rejected successfully",
        inspection_id: Number(inspectionId),
        status: "REJECTED",
      });
    } catch (error) {
      console.error("Reject inspection error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to reject inspection",
      });
    }
  },
);
// Get rejected inspection for a chassis number
app.get("/api/inspections/rejected/:chassisNo", async (req, res) => {
  try {
    const { chassisNo } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        i.id,
        i.vehicle_id,
        i.checklist_type_id,
        i.started_by,
        i.status,
        v.chassis_no,
        v.model,
        v.color
      FROM inspections i
      JOIN vehicles v
        ON i.vehicle_id = v.id
      WHERE v.chassis_no = ?
        AND i.status = 'REJECTED'
      ORDER BY i.id DESC
      LIMIT 1
      `,
      [chassisNo],
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        inspection: null,
      });
    }

    res.json({
      success: true,
      found: true,
      inspection: rows[0],
    });
  } catch (error) {
    console.error("Rejected inspection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to find rejected inspection",
    });
  }
});
// Start rework for a rejected inspection
app.put("/api/inspections/:inspectionId/rework", async (req, res) => {
  try {
    const { inspectionId } = req.params;

    console.log("STARTING REWORK:", inspectionId);

    // Check that the inspection exists and is rejected
    const [inspections] = await db.query(
      `
      SELECT id, status
      FROM inspections
      WHERE id = ?
      `,
      [inspectionId],
    );

    if (inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }

    if (inspections[0].status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Inspection is not rejected",
      });
    }

    // C
    // hange rejected inspection back to in-progress
    const [updateResult] = await db.query(
      `
      UPDATE inspections
      SET
        status = 'IN_PROGRESS',
        completed_at = NULL
      WHERE id = ?
        AND status = 'REJECTED'
      `,
      [inspectionId],
    );

    console.log("REWORK ROWS UPDATED:", updateResult.affectedRows);

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to start rework",
      });
    }

    res.json({
      success: true,
      message: "Rework started successfully",
      inspection_id: Number(inspectionId),
      status: "IN_PROGRESS",
    });
  } catch (error) {
    console.error("Start rework error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to start rework",
    });
  }
});
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
