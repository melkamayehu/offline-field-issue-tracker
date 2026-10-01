import { getReports, saveReport } from "../db/database";

const API_URL =
  "https://offline-field-issue-tracker-1.onrender.com/api/reports";

let isSyncing = false;

async function recordHistory(reportId, eventType, message) {
  try {
    await fetch(`${API_URL}/${reportId}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        message,
      }),
    });
  } catch (error) {
    console.error("Failed to record history:", error);
  }
}

export async function syncPendingReports() {
  if (isSyncing) {
    console.log("Sync already running. Skipping.");
    return;
  }

  isSyncing = true;

  try {
    console.log("SYNC STARTED");

    const reports = await getReports();

    console.log("All local reports:", reports);

    const pendingReports = reports.filter(
      (report) =>
        report.syncState === "pending" ||
        report.syncState === "failed" ||
        report.syncState === "syncing"
    );

    console.log("Reports waiting for sync:", pendingReports);

    for (const report of pendingReports) {
      try {
        console.log("Syncing report:", report.id);

        await saveReport({
          ...report,
          syncState: "syncing",
        });

        console.log("Sending report to server...");

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(report),
        });

        console.log("Server response:", response.status);

        if (!response.ok) {
          const errorBody = await response.text();

          throw new Error(
            `Server returned ${response.status}: ${errorBody}`
          );
        }

        const serverReport = await response.json();

        console.log("Server accepted report:", serverReport);

        await saveReport({
          ...report,
          ...serverReport,
          syncState: "synced",
        });

        await recordHistory(
          report.id,
          "SYNCED",
          "Report synchronized with server"
        );

        console.log(`Report ${report.id} synchronized`);
      } catch (error) {
        await saveReport({
          ...report,
          syncState: "failed",
        });

        await recordHistory(
          report.id,
          "SYNC_FAILED",
          error.message
        );

        console.error(
          `Failed to synchronize report ${report.id}:`,
          error
        );
      }
    }

    console.log("SYNC FINISHED");
  } finally {
    isSyncing = false;
  }
}

