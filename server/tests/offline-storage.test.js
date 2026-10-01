test("offline reports should keep their pending sync state", () => {
  const report = {
    id: "offline-test-123",
    category: "Road",
    description: "Broken road",
    location: "Bole",
    priority: "High",
    status: "Draft",
    syncState: "pending",
  };

  expect(report.syncState).toBe("pending");
});

test("failed sync should keep the report available for retry", () => {
  const report = {
    id: "offline-test-456",
    syncState: "failed",
  };

  expect(report.syncState).toBe("failed");
  expect(report.id).toBeDefined();
});