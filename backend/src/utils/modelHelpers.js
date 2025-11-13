const { applyCenterFilter } = require("./applyCenterFilter");

const wrapIdentifier = (key, quote = true) =>
  quote ? `"${key}"` : key;

const buildInsertFragments = (fields = {}, { quote = true } = {}) => {
  const keys = Object.keys(fields);
  const columns = keys.map((key) => wrapIdentifier(key, quote)).join(", ");
  const values = Object.values(fields);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  return { columns, values, placeholders };
};

const buildUpdateFragments = (fields = {}, { quote = true } = {}) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys
    .map((key, index) => `${wrapIdentifier(key, quote)} = $${index + 1}`)
    .join(", ");
  return { setClause, values };
};

const scopeQuery = (
  query,
  { centerId, isSuperAdmin, column = '"center_id"', alias, enforce } = {},
) => {
  const shouldEnforce =
    enforce !== undefined ? enforce : Boolean(centerId && !isSuperAdmin);

  return applyCenterFilter(
    query,
    { center_id: centerId },
    {
      centerId,
      column,
      alias,
      enforce: shouldEnforce,
    },
  );
};

module.exports = {
  buildInsertFragments,
  buildUpdateFragments,
  scopeQuery,
};

