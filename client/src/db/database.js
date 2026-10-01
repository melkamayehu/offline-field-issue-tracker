import { openDB } from "idb";

const dbPromise = openDB("offline-field-issue-tracker", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("reports")) {
      db.createObjectStore("reports", {
        keyPath: "id",
      });
    }
  },
});

export async function saveReport(report) {
  const db = await dbPromise;
  await db.put("reports", report);
}

export async function getReports() {
  const db = await dbPromise;
  return await db.getAll("reports");
}

export async function getReport(id) {
  const db = await dbPromise;
  return await db.get("reports", id);
}

export async function deleteReport(id) {
  const db = await dbPromise;
  await db.delete("reports", id);
}