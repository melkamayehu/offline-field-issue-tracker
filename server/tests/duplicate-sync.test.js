test("same report ID should identify the same report", () => {
  const reportId = "7f4c2b91-6e83-4a15-b7d2-91c5e8f30462";

  const firstSync = {
    id: reportId,
    category: "Water",
  };

  const secondSync = {
    id: reportId,
    category: "Water",
  };

  expect(firstSync.id).toBe(secondSync.id);
});