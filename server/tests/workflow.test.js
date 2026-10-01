const validTransitions = {
  Draft: ["Submitted"],
  Submitted: ["Assigned", "Rejected"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: [],
  Rejected: [],
};

function canTransition(currentStatus, newStatus) {
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

test("allows valid Draft to Submitted transition", () => {
  expect(canTransition("Draft", "Submitted")).toBe(true);
});

test("rejects invalid Draft to Resolved transition", () => {
  expect(canTransition("Draft", "Resolved")).toBe(false);
});

test("allows Submitted to Rejected transition", () => {
  expect(canTransition("Submitted", "Rejected")).toBe(true);
});

test("rejects changing a Resolved report", () => {
  expect(canTransition("Resolved", "Draft")).toBe(false);
});