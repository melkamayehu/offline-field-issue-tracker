const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const pool = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Offline Field Issue Tracker API is running",
  });
});

const validTransitions = {
  Draft: ["Submitted"],
  Submitted: ["Assigned", "Rejected"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: [],
  Rejected: [],
};

// Create a report
app.post("/api/reports", async (req, res) => {
  const {
    id,
    category,
    description,
    location,
    priority,
    status = "Draft",
    reported_at,
  } = req.body;

  if (!category || !description || !location || !priority || !reported_at) {
    return res.status(400).json({
      error:
        "Category, description, location, priority, and reported_at are required.",
    });
  }

  const reportId = id || randomUUID();

  try {
    const result = await pool.query(
      `
      INSERT INTO reports (
        id,
        category,
        description,
        location,
        priority,
        status,
        reported_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
      `,
      [
        reportId,
        category,
        description,
        location,
        priority,
        status,
        reported_at,
      ]
    );

    // Report already exists
    if (result.rows.length === 0) {
      const existing = await pool.query(
        "SELECT * FROM reports WHERE id = $1",
        [reportId]
      );

      return res.status(200).json(existing.rows[0]);
    }

    // Record creation in history
    await pool.query(
      `
      INSERT INTO report_history (
        id,
        report_id,
        event_type,
        new_status,
        message
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        randomUUID(),
        reportId,
        "CREATED",
        status,
        "Report created",
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create report",
    });
  }
});

// Get all reports
app.get("/api/reports", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM reports ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch reports",
    });
  }
});

// Change report status
app.patch("/api/reports/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status: newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({
      error: "New status is required.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM reports WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Report not found.",
      });
    }

    const report = result.rows[0];
    const currentStatus = report.status;

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
      });
    }

    const updated = await pool.query(
      `
      UPDATE reports
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP,
          sync_version = sync_version + 1
      WHERE id = $2
      RETURNING *
      `,
      [newStatus, id]
    );

    await pool.query(
      `
      INSERT INTO report_history (
        id,
        report_id,
        event_type,
        old_status,
        new_status,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        randomUUID(),
        id,
        "STATUS_CHANGED",
        currentStatus,
        newStatus,
        `Status changed from ${currentStatus} to ${newStatus}`,
      ]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update report status.",
    });
  }
});

// Get report history
app.get("/api/reports/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM report_history
      WHERE report_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch report history.",
    });
  }
});

// Add a history event
app.post("/api/reports/:id/history", async (req, res) => {
  const { id } = req.params;
  const { event_type, message } = req.body;

  if (!event_type) {
    return res.status(400).json({
      error: "event_type is required.",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO report_history (
        id,
        report_id,
        event_type,
        message
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        randomUUID(),
        id,
        event_type,
        message || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to record history.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

