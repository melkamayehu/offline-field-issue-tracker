import { useEffect, useState } from "react";
import { getReports } from "../db/database";

function ReportList() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const savedReports = await getReports();
    setReports(savedReports);
  }

  return (
    <div>
      <h2>Saved Reports</h2>

      {reports.length === 0 ? (
        <p>No reports saved yet.</p>
      ) : (
        reports.map((report) => (
          <div key={report.id}>
            <h3>{report.category}</h3>

            <p>{report.description}</p>

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

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default ReportList;