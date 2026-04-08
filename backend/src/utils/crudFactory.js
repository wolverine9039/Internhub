const pool = require('../config/db');
const AppError = require('./AppError');
const { buildPatchFields } = require('./queryHelpers');

/**
 * Generates a standard GET /:id route handler
 * @param {string} tableName 
 * @param {string} entityName 
 */
function getById(tableName, entityName) {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (rows.length === 0) throw new AppError(404, 'NOT_FOUND', `${entityName} not found`);
      res.status(200).json(rows[0]);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Generates a standard PATCH /:id route handler
 * @param {string} tableName 
 * @param {string} entityName 
 * @param {string[]} allowedFields 
 */
function patchById(tableName, entityName, allowedFields) {
  return async (req, res, next) => {
    try {
      const { setClauses, params } = buildPatchFields(req.body, allowedFields);
      params.push(req.params.id);
      
      const [result] = await pool.execute(`UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`, params);
      if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', `${entityName} not found`);

      const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.status(200).json(rows[0]);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Generates a standard DELETE /:id route handler
 * @param {string} tableName 
 * @param {string} entityName 
 */
function deleteById(tableName, entityName) {
  return async (req, res, next) => {
    try {
      const [result] = await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (result.affectedRows === 0) throw new AppError(404, 'NOT_FOUND', `${entityName} not found`);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  getById,
  patchById,
  deleteById
};
