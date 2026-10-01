function isValidReport(report) {
  return Boolean(
    report.category &&
    report.description &&
    report.location &&
    report.priority &&
    report.reported_at
  );
}

test("accepts a report with all required fields", () => {
  const report = {
    category: "Road",
    description: "Large pothole",
    location: "Bole",
    priority: "High",
    reported_at: "2026-10-01T10:00:00",
  };

  expect(isValidReport(report)).toBe(true);
});

test("rejects a report missing required fields", () => {
  const report = {
    category: "Road",
    description: "Large pothole",
    location: "",
    priority: "High",
    reported_at: "2026-10-01T10:00:00",
  };

  expect(isValidReport(report)).toBe(false);
});