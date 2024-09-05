import { existsSync, unlinkSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import Duckydb from "../src/index.js";

describe("Opening connections", () => {
  test("Opens a database", async () => {
    const db = new Duckydb();
    expect(db).toBeInstanceOf(Duckydb);
    await db.close();
  });

  test("Opens a database with a file name for a persistent database", async () => {
    const db = new Duckydb("test.duckdb");
    expect(db).toBeInstanceOf(Duckydb);
    await db.close();
    expect(existsSync("test.duckdb")).toBe(true);
    unlinkSync("test.duckdb");
  });

  test("Opens a database with configuration options", async () => {
    const db = new Duckydb(":memory:", {
      access_mode: "READ_WRITE",
      max_memory: "512MB",
      threads: "4",
    });
    expect(db).toBeInstanceOf(Duckydb);
    await db.close();
  });
});

describe("Executing queries", () => {
  let db;

  beforeAll(async () => {
    db = new Duckydb();
  });

  afterAll(async () => {
    await db.close();
  });

  test("Executes a simple query", async () => {
    const sql = "SELECT 42 AS answer;";
    const result = await db.query(sql);
    expect(result).toEqual([{ answer: 42 }]);
  });

  test("Executes a query with positionalparameters", async () => {
    const sql = "SELECT ? AS answer, ? AS foo";
    const result = await db.query(sql, [42, "bar"]);
    expect(result).toEqual([{ answer: 42, foo: "bar" }]);
  });

  test("Executes a query with named parameters", async () => {
    const sql = "SELECT :answer AS answer, :foo AS foo";
    const result = await db.query(sql, { foo: "bar", answer: 42 });
    expect(result).toEqual([{ answer: 42, foo: "bar" }]);
  });

  test("Handles errors in simple queries", async () => {
    const sql = "SELECT * FROM non_existent_table;";
    await expect(db.query(sql)).rejects.toThrow();
    try {
      await db.query(sql);
    } catch (error) {
      expect(error.message).toContain(
        "Table with name non_existent_table does not exist!",
      );
    }
  });

  test("Handles missing named parameters", async () => {
    const sql = "SELECT :answer AS answer, :foo AS foo";
    await expect(db.query(sql, { answer: 42 })).rejects.toThrow(
      "Missing parameter",
    );
  });

  test("Handles invalid parameter type", async () => {
    const sql = "SELECT ? AS answer";
    await expect(db.query(sql, 42)).rejects.toThrow("Invalid parameter type");
  });
});

describe("Closing connections", () => {
  test("Does not execute queries on a closed database", async () => {
    const db = new Duckydb();
    const sql = "SELECT 42 AS answer;";
    await db.close();
    await expect(db.query(sql)).rejects.toThrow(
      "Connection was never established or has been closed already",
    );
  });
});
