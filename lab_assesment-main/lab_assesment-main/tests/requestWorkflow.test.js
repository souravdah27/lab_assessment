import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionRequest } from "../src/utils/requestWorkflow.js";

test("allows only the next workflow step or rejection where permitted", () => {
  assert.equal(canTransitionRequest("Pending", "Under Review"), true);
  assert.equal(canTransitionRequest("Pending", "Rejected"), true);
  assert.equal(canTransitionRequest("Under Review", "Assigned"), true);
  assert.equal(canTransitionRequest("Under Review", "Rejected"), true);
  assert.equal(canTransitionRequest("Assigned", "In Progress"), true);
  assert.equal(canTransitionRequest("In Progress", "Resolved"), true);
  assert.equal(canTransitionRequest("Resolved", "Closed"), true);
});

test("rejects skipped, reversed, terminal, and unknown transitions", () => {
  assert.equal(canTransitionRequest("Pending", "Closed"), false);
  assert.equal(canTransitionRequest("Under Review", "Resolved"), false);
  assert.equal(canTransitionRequest("Closed", "In Progress"), false);
  assert.equal(canTransitionRequest("Rejected", "Pending"), false);
  assert.equal(canTransitionRequest("Unknown", "Pending"), false);
});
