const {
  needsCenterRestriction,
  ROLE_KEY_BY_ID,
  ROLE_RULES,
} = require("../constants/rbacMatrix");

const ROLE_ID_BY_KEY = Object.entries(ROLE_KEY_BY_ID).reduce((acc, [id, key]) => {
  acc[key] = parseInt(id, 10);
  return acc;
}, {});

const parseRoleId = (user = {}) => {
  const potential = [
    user.user_type,
    user.role_id,
    user.roleId,
    user.role,
  ];

  for (const value of potential) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const direct = ROLE_RULES[value]?.id;
      if (direct) return direct;
      const trimmed = value.trim();
      if (ROLE_ID_BY_KEY[trimmed]) return ROLE_ID_BY_KEY[trimmed];
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const normalizeQuery = (query) => {
  if (typeof query === "string") {
    return { text: query, values: [] };
  }

  if (query && typeof query === "object") {
    const text = query.text || query.sql;
    const values = Array.isArray(query.values)
      ? [...query.values]
      : Array.isArray(query.params)
        ? [...query.params]
        : [];
    return { text, values };
  }

  throw new Error("applyCenterFilter: unsupported query input");
};

const ensureInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const appendCenterClause = (sql, columnRef, placeholder) => {
  // Trim the SQL string but preserve structure
  sql = sql.trim();
  
  const hasWhere = /\bwhere\b/i.test(sql);
  
  // Simple approach: find WHERE, ORDER BY, GROUP BY, LIMIT, RETURNING at top level
  // by checking they're not inside parentheses (subqueries)
  const findTopLevelKeyword = (pattern, sql) => {
    let depth = 0;
    let inString = false;
    let stringChar = null;
    const regex = new RegExp(pattern, 'i');
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const prevChar = i > 0 ? sql[i - 1] : '';
      
      // Track string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
        continue;
      }
      
      if (inString) continue;
      
      // Track parentheses depth
      if (char === '(') depth++;
      if (char === ')') depth--;
      
      // Only match at top level (depth === 0)
      if (depth === 0) {
        const remaining = sql.substring(i);
        const match = remaining.match(regex);
        if (match && match.index === 0) {
          return i;
        }
      }
    }
    return -1;
  };
  
  // Find top-level clauses
  const wherePos = findTopLevelKeyword('\\bWHERE\\b', sql);
  const orderByPos = findTopLevelKeyword('\\bORDER\\s+BY\\b', sql);
  const groupByPos = findTopLevelKeyword('\\bGROUP\\s+BY\\b', sql);
  const limitPos = findTopLevelKeyword('\\bLIMIT\\b', sql);
  const returningPos = findTopLevelKeyword('\\bRETURNING\\b', sql);
  
  // Determine insert position - after WHERE (if exists) but before ORDER BY/GROUP BY/etc.
  let insertPosition = sql.length;
  
  if (orderByPos >= 0) insertPosition = Math.min(insertPosition, orderByPos);
  if (groupByPos >= 0) insertPosition = Math.min(insertPosition, groupByPos);
  if (limitPos >= 0) insertPosition = Math.min(insertPosition, limitPos);
  if (returningPos >= 0) insertPosition = Math.min(insertPosition, returningPos);
  
  if (hasWhere && wherePos >= 0) {
    // Insert AND clause before ORDER BY/GROUP BY/LIMIT/RETURNING
    const beforeClause = sql.substring(0, insertPosition).trim();
    const afterClause = sql.substring(insertPosition).trim();
    // Remove any trailing AND/OR operators from beforeClause
    const cleanedBefore = beforeClause.replace(/\s+(AND|OR)\s*$/i, '').trim();
    // Ensure proper spacing
    if (afterClause) {
      return `${cleanedBefore} AND ${columnRef} = ${placeholder} ${afterClause}`;
    }
    return `${cleanedBefore} AND ${columnRef} = ${placeholder}`;
  }
  
  // For queries without WHERE, insert it right before ORDER BY/GROUP BY/etc.
  const beforeClause = sql.substring(0, insertPosition).trim();
  const afterClause = sql.substring(insertPosition).trim();
  
  // Ensure proper spacing - add WHERE clause
  if (afterClause) {
    return `${beforeClause} WHERE ${columnRef} = ${placeholder} ${afterClause}`;
  }
  return `${beforeClause} WHERE ${columnRef} = ${placeholder}`;
};

/**
 * Injects center-based filtering into an SQL query when the current user's
 * role requires tenant isolation.
 *
 * @param {string|object} query - raw SQL string or { text, values } object
 * @param {object} user - decoded JWT user payload
 * @param {object} [options]
 * @param {string} [options.alias] - optional table alias to prefix column
 * @param {string} [options.column="center_id"] - column name to use
 * @param {number} [options.centerId] - override center_id value
 * @returns {{ text: string, values: any[] }}
 */
const applyCenterFilter = (query, user = {}, options = {}) => {
  const {
    alias,
    column = "center_id",
    centerId: overrideCenter,
    enforce,
    skip,
  } = options;

  const roleId = parseRoleId(user);
  if (skip) {
    const normalized = normalizeQuery(query);
    return normalized;
  }

  const requireFilter =
    enforce !== undefined ? Boolean(enforce) : needsCenterRestriction(roleId);

  const { text, values } = normalizeQuery(query);

  if (!requireFilter) {
    return { text, values };
  }

  const centerId = ensureInteger(
    overrideCenter !== undefined ? overrideCenter : user.center_id,
  );

  if (centerId === null) {
    // No center info available; return original query to avoid throwing
    return { text, values };
  }

  const columnRef = alias ? `${alias}.${column}` : column;
  const placeholder = `$${values.length + 1}`;
  const filteredSql = appendCenterClause(text, columnRef, placeholder);

  return {
    text: filteredSql,
    values: [...values, centerId],
  };
};

module.exports = {
  applyCenterFilter,
};

