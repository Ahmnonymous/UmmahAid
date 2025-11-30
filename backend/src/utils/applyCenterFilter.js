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
  const hasWhere = /\bwhere\b/i.test(sql);
  
  // Check if there's an ORDER BY, GROUP BY, or LIMIT clause
  const orderByMatch = sql.match(/\bORDER\s+BY\b/i);
  const groupByMatch = sql.match(/\bGROUP\s+BY\b/i);
  const limitMatch = sql.match(/\bLIMIT\b/i);
  
  // Find the position where we should insert the new condition
  let insertPosition = sql.length;
  if (orderByMatch) {
    insertPosition = Math.min(insertPosition, orderByMatch.index);
  }
  if (groupByMatch) {
    insertPosition = Math.min(insertPosition, groupByMatch.index);
  }
  if (limitMatch) {
    insertPosition = Math.min(insertPosition, limitMatch.index);
  }
  
  if (hasWhere) {
    // Insert AND clause before ORDER BY/GROUP BY/LIMIT
    const beforeClause = sql.substring(0, insertPosition).trim();
    const afterClause = sql.substring(insertPosition);
    return `${beforeClause} AND ${columnRef} = ${placeholder}${afterClause ? ' ' + afterClause : ''}`;
  }
  
  // Insert WHERE clause before ORDER BY/GROUP BY/LIMIT
  const beforeClause = sql.substring(0, insertPosition).trim();
  const afterClause = sql.substring(insertPosition);
  return `${beforeClause} WHERE ${columnRef} = ${placeholder}${afterClause ? ' ' + afterClause : ''}`;
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

