import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabaseConnection(databaseUrl: string) {
	const sql = postgres(databaseUrl);
	return drizzle(sql, { schema });
}

export function createHyperdriveConnection(hyperdriveUrl: string) {
	const sql = postgres(hyperdriveUrl);
	return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDatabaseConnection>;
