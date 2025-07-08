import { describe, expect, it } from "vitest";
import { jobs } from "./index";

describe("Jobs", () => {
	it("should have jobs object", () => {
		expect(jobs).toBeDefined();
		expect(typeof jobs).toBe("object");
	});
});
