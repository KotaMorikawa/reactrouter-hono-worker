import { describe, expect, it } from "vitest";
import { schema } from "./schema";

describe("Schema", () => {
	it("should have schema object", () => {
		expect(schema).toBeDefined();
		expect(typeof schema).toBe("object");
	});
});
