import duckdb from "duckdb";

/**
 * A wrapper class for DuckDB with promise-based queries and named parameters support.
 */
export default class Duckydb {
  /**
   * Creates a new Duckydb instance.
   * @param {string} [path=":memory:"] - The path to the database file or ":memory:" for in-memory database.
   * @param {Object} [config] - Configuration options for DuckDB.
   */
  constructor(path = ":memory:", config) {
    this.db = new duckdb.Database(path, config);
  }

  /**
   * Executes a SQL query with optional parameters.
   * @param {string} query - The SQL query to execute.
   * @param {Array|Object} [params=[]] - Query parameters (array for positional, object for named).
   * @returns {Promise<Array>} A promise that resolves with the query results.
   * @throws {Error} If there's an error during query execution or invalid parameter type.
   */
  async query(query, params = []) {
    return new Promise((resolve, reject) => {
      const callback = (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      };

      try {
        if (Array.isArray(params)) {
          this.db.all(query, ...params, callback);
        } else if (typeof params === "object") {
          const namedParams = [];
          const processedQuery = query.replace(/:\w+/g, (match) => {
            const key = match.slice(1);
            if (Object.prototype.hasOwnProperty.call(params, key)) {
              namedParams.push(params[key]);
              return "?";
            }
            throw new Error(`Missing parameter: ${key}`);
          });
          this.db.all(processedQuery, ...namedParams, callback);
        } else {
          throw new Error("Invalid parameter type. Expected array or object.");
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>} A promise that resolves when the database is closed.
   * @throws {Error} If there's an error while closing the database.
   */
  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
