import { useEffect, useState } from "react";
import { getReports, saveReport } from "../db/database";

const API_URL = "http://localhost:5000/api/reports";

const validTransitions = {
  Draft: ["Submitted"],
  Submitted: ["Assigned", "Rejected"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: [],
  Rejected: [],
};

function ReportList() {
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState({});
  const [openHistory, setOpenHistory] = useState({});

  async function loadReports() {
    try {
      const savedReports = await getReports();
      setReports(savedReports);
    } catch (error) {
      console.error("Failed to load reports:", error);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function changeStatus(report, newStatus) {
    try {
      const response = await fetch(
        `${API_URL}/${report.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to change status.");
        return;
      }

      await saveReport({
        ...report,
        ...data,
        syncState: "synced",
      });

      await loadReports();
    } catch (error) {
      console.error("Failed to change status:", error);
      alert("Could not connect to the server.");
    }
  }

  async function viewHistory(reportId) {
    try {
      const response = await fetch(
        `${API_URL}/${reportId}/history`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to load history.");
        return;
      }

      setHistory((previous) => ({
        ...previous,
        [reportId]: data,
      }));

      setOpenHistory((previous) => ({
        ...previous,
        [reportId]: !previous[reportId],
      }));
    } catch (error) {
      console.error("Failed to load history:", error);
      alert("Could not connect to the server.");
    }
  }

  return (
    <div>
      <h2>Saved Reports</h2>

      {reports.length === 0 ? (
        <p>No reports saved yet.</p>
      ) : (
        reports.map((report) => {
          const nextStatuses =
            validTransitions[report.status] || [];

          return (
            <div key={report.id}>
              <h3>{report.category}</h3>

              <p>
                <strong>Description:</strong>{" "}
                {report.description}
              </p>

              <p>
                <strong>Location:</strong> {report.location}
              </p>

              <p>
                <strong>Priority:</strong> {report.priority}
              </p>

              <p>
                <strong>Status:</strong> {report.status}
              </p>

              <p>
                <strong>Sync:</strong> {report.syncState}
              </p>

              <p>
                <strong>Reported at:</strong>{" "}
                {report.reported_at}
              </p>

              {nextStatuses.length > 0 && (
                <div>
                  <strong>Change status:</strong>

                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        changeStatus(report, status)
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}

              <br />

              <button onClick={() => viewHistory(report.id)}>
                {openHistory[report.id]
                  ? "Hide History"
                  : "View History"}
              </button>

              {openHistory[report.id] && (
                <div>
                  <h4>History</h4>

                  {history[report.id]?.length === 0 ? (
                    <p>No history available.</p>
                  ) : (
                    history[report.id]?.map((event) => (
                      <div key={event.id}>
                        <p>
                          <strong>{event.event_type}</strong>
                        </p>

                        {event.old_status &&
                          event.new_status && (
                            <p>
                              {event.old_status} →{" "}
                              {event.new_status}
                            </p>
                          )}

                        {event.message && (
                          <p>{event.message}</p>
                        )}

                        <small>
                          {new Date(
                            event.created_at
                          ).toLocaleString()}
                        </small>

                        <hr />
                      </div>
                    ))
                  )}
                </div>
              )}

              <hr />
            </div>
          );
        })
      )}
    </div>
  );
}

export default ReportList;

