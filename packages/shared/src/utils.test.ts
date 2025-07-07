import { describe, expect, it } from "vitest";
import { formatDate } from "./utils";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = formatDate(date);
    expect(result).toBe("2024-01-15");
  });
});
