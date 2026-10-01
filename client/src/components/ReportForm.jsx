import { useState } from "react";
import { saveReport } from "../db/database";

function ReportForm() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [reportedAt, setReportedAt] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const report = {
      id: crypto.randomUUID(),
      category,
      description,
      location,
      priority,
      status: "Draft",
      reported_at: reportedAt,
      syncState: "pending",
    };

    await saveReport(report);

    alert("Report saved locally!");

    setCategory("");
    setDescription("");
    setLocation("");
    setPriority("Medium");
    setReportedAt("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Report</h2>

      <label>Category</label>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />

      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <label>Location</label>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

      <label>Priority</label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <label>Date and Time</label>
      <input
        type="datetime-local"
        value={reportedAt}
        onChange={(e) => setReportedAt(e.target.value)}
        required
      />

      <button type="submit">Save Report</button>
    </form>
  );
}

export default ReportForm;