// In-memory mock of @op-engineering/op-sqlite for unit tests.
// Supports the subset of the DB API used by src/db/index.ts.

class InMemoryDB {
  constructor() {
    this.tables = {};
    this.inTransaction = false;
    this.transactionQueue = [];
  }

  _getTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
    }
    return this.tables[name];
  }

  _parseWhere(query) {
    // Very small parser for "WHERE id = ?" style queries used in the app.
    const match = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    return match ? match[1] : null;
  }

  execute(query, params = []) {
    const normalized = query.trim().replace(/\s+/g, ' ');
    const upper = normalized.toUpperCase();

    const result = { rowsAffected: 0, rows: [] };

    if (upper.startsWith('CREATE TABLE')) {
      const match = normalized.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) this._getTable(match[1]);
    } else if (upper.startsWith('CREATE INDEX')) {
      // no-op
    } else if (upper.startsWith('BEGIN TRANSACTION')) {
      this.inTransaction = true;
    } else if (upper.startsWith('COMMIT')) {
      this.inTransaction = false;
      for (const cb of this.transactionQueue) cb();
      this.transactionQueue = [];
    } else if (upper.startsWith('ROLLBACK')) {
      this.inTransaction = false;
      this.transactionQueue = [];
    } else if (upper.startsWith('INSERT')) {
      const match = normalized.match(/INSERT(?: OR IGNORE)? INTO (\w+)/i);
      if (match) {
        const table = this._getTable(match[1]);
        // Map positional params to columns by parsing the column list.
        const colMatch = normalized.match(/\(([^)]+)\) VALUES/i);
        const columns = colMatch
          ? colMatch[1].split(',').map((c) => c.trim())
          : [];
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = params[idx];
        });
        if (normalized.toUpperCase().includes('OR IGNORE')) {
          const pk = columns[0];
          const exists = table.some((r) => r[pk] === row[pk]);
          if (!exists) table.push(row);
        } else {
          table.push(row);
        }
        result.rowsAffected = 1;
      }
    } else if (upper.startsWith('SELECT')) {
      const fromMatch = normalized.match(/FROM (\w+)/i);
      if (!fromMatch) return Promise.resolve(result);
      const tableName = fromMatch[1];
      const table = this._getTable(tableName);
      const whereCol = this._parseWhere(normalized);
      let rows = table;
      if (whereCol) {
        rows = rows.filter((r) => r[whereCol] === params[0]);
      }
      // Map snake_case columns back to the aliased names used in SELECT.
      const selectMatch = normalized.match(/SELECT (.+) FROM/i);
      let selectedColumns = [];
      if (selectMatch && !selectMatch[1].includes('*')) {
        selectedColumns = selectMatch[1].split(',').map((c) => {
          const parts = c.trim().split(/\s+AS\s+/i);
          return parts.length > 1 ? parts[1].trim() : c.trim();
        });
      }
      result.rows = rows.map((row) => {
        if (selectedColumns.length === 0) return row;
        const mapped = {};
        selectedColumns.forEach((col) => {
          mapped[col] = row[col] !== undefined ? row[col] : null;
        });
        return mapped;
      });
      if (normalized.match(/ORDER BY .+ DESC/i)) {
        const orderMatch = normalized.match(/ORDER BY (\w+) DESC/i);
        if (orderMatch) {
          const col = orderMatch[1];
          result.rows.sort((a, b) => (b[col] ?? 0) - (a[col] ?? 0));
        }
      }
      if (normalized.match(/LIMIT/i)) {
        const limitMatch = normalized.match(/LIMIT (\d+) OFFSET (\d+)/i);
        if (limitMatch) {
          const limit = Number(limitMatch[1]);
          const offset = Number(limitMatch[2]);
          result.rows = result.rows.slice(offset, offset + limit);
        }
      }
    } else if (upper.startsWith('DELETE')) {
      const match = normalized.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        const whereCol = this._parseWhere(normalized);
        const table = this._getTable(tableName);
        if (whereCol) {
          const before = table.length;
          this.tables[tableName] = table.filter((r) => r[whereCol] !== params[0]);
          result.rowsAffected = before - this.tables[tableName].length;
        } else {
          result.rowsAffected = table.length;
          this.tables[tableName] = [];
        }
      }
    }

    return Promise.resolve(result);
  }
}

function open(options) {
  return new InMemoryDB();
}

module.exports = {
  open,
  openSync: open,
  openAsync: (options) => Promise.resolve(open(options)),
};
