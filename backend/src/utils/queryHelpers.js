/**
 * Shared query helpers — eliminates duplicated pagination, sorting,
 * and PATCH-builder boilerplate across route files.
 */
const AppError = require('./AppError');

/**
 * Parse pagination params from a request query.
 * @param {object} query - req.query
 * @returns {{ page: number, pageSize: number, offset: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.page_size, 10) || 20));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/**
 * Parse sorting params from a request query.
 * @param {object}   query         - req.query
 * @param {string[]} allowedFields - whitelist of sortable column names
 * @param {string}   [defaultField='created_at']
 * @param {string}   [defaultOrder='DESC']
 * @returns {{ sortField: string, sortOrder: string }}
 */
function parseSorting(query, allowedFields, defaultField = 'created_at', defaultOrder = 'DESC') {
  let sortField = defaultField;
  let sortOrder = defaultOrder;
  if (query.sort) {
    const raw = query.sort;
    sortField = raw.startsWith('-') ? raw.slice(1) : raw;
    sortOrder  = raw.startsWith('-') ? 'DESC' : 'ASC';
    if (!allowedFields.includes(sortField)) sortField = defaultField;
  }
  return { sortField, sortOrder };
}

/**
 * Build a dynamic PATCH query from allowed fields.
 * @param {object}   body          - req.body
 * @param {string[]} allowedFields - whitelist of updatable columns
 * @returns {{ setClauses: string[], params: any[] }}
 * @throws {AppError} if no valid fields provided
 */
function buildPatchFields(body, allowedFields) {
  const setClauses = [];
  const params = [];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  if (setClauses.length === 0) {
    throw new AppError(422, 'VALIDATION_ERROR', 'No valid fields provided');
  }
  return { setClauses, params };
}

/**
 * Format a standard paginated JSON response.
 * @param {any[]}  items
 * @param {number} page
 * @param {number} pageSize
 * @param {number} total
 * @returns {object}
 */
function paginatedResponse(items, page, pageSize, total) {
  return {
    items,
    page,
    page_size: pageSize,
    total,
    pages: Math.ceil(total / pageSize),
  };
}

module.exports = { parsePagination, parseSorting, buildPatchFields, paginatedResponse };
