const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const { log } = require('../config/logging');

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://cshalini251_db_user:1234@cluster0.3logotu.mongodb.net/sparkyfitness_db?retryWrites=true&w=majority';

let isConnected = false;
async function connectToMongo() {
  if (isConnected) return;
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    log('info', 'Connected to MongoDB successfully.');
  } catch (err) {
    log('error', 'Failed to connect to MongoDB:', err);
    throw err;
  }
}

const DynamicSchema = new mongoose.Schema({ _id: String }, { strict: false, versionKey: false, timestamps: false });

function getModel(tableName) {
  // Replace schema prefixes like auth.users, system.schema_migrations with underscores
  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  if (mongoose.models[cleanName]) {
    return mongoose.models[cleanName];
  }
  return mongoose.model(cleanName, DynamicSchema, cleanName);
}

function splitByComma(str) {
  const result = [];
  let current = '';
  let parenLevel = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') parenLevel++;
    else if (char === ')') parenLevel--;
    
    if (char === ',' && parenLevel === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Convert $1, $2 representation to zero-indexed parameter lookup
function getParamValue(placeholder, params) {
  if (!placeholder || typeof placeholder !== 'string') return undefined;
  const match = placeholder.match(/\$(\d+)/);
  if (match) {
    const idx = parseInt(match[1], 10) - 1;
    return params[idx];
  }
  return undefined;
}

// Enforce RLS rules similar to public.set_user_id()
function applyRLS(tableName, filter, currentUserId) {
  if (!currentUserId) return filter;

  // Tables that are global / shared and do not enforce user-level RLS
  const globalTables = [
    'system_schema_migrations',
    'global_settings',
    'oidc_providers',
    'exercises', // shared/system exercises
    'foods', // shared/system foods
    'admin_activity_logs',
    'food_variants',
    'meal_foods',
    'workout_preset_exercise_sets',
    'workout_plan_assignment_sets',
    'exercise_entry_sets',
    'pg_roles',
    'goal_presets',
    'profiles',
    'user_nutrient_display_preferences'
  ];

  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  if (globalTables.includes(cleanName)) {
    return filter;
  }

  // Determine owner field name based on table
  let ownerField = 'user_id';
  if (cleanName === 'family_access') {
    // family_access has owner_user_id or family_user_id depending on context
    // Allow both by checking for either, or let query handle it
    return filter;
  }

  // Apply user filter if the table is typically user-owned
  filter[ownerField] = currentUserId;
  return filter;
}

// Helper to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Client-side JOIN simulator for specific known joins
async function handleJoins(tableName, docs) {
  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  if (cleanName === 'family_access') {
    const Profile = getModel('profiles');
    const User = getModel('auth_users');
    for (const doc of docs) {
      const ownerId = doc.owner_user_id;
      if (ownerId) {
        const profile = await Profile.findOne({ _id: ownerId }).lean();
        const user = await User.findOne({ _id: ownerId }).lean();
        doc.full_name = profile ? profile.full_name : null;
        doc.email = user ? user.email : null;
      }
    }
  } else if (cleanName === 'auth_users') {
    const Profile = getModel('profiles');
    for (const doc of docs) {
      const profile = await Profile.findOne({ _id: doc._id }).lean();
      doc.full_name = profile ? profile.full_name : null;
    }
  }
  return docs;
}

async function executeSQL(sql, params = [], currentUserId = null) {
  await connectToMongo();

  const sqlClean = sql.trim().replace(/\s+/g, ' ');
  const sqlLower = sqlClean.toLowerCase();

  // 1. Transaction controls
  if (sqlLower === 'begin' || sqlLower === 'commit' || sqlLower === 'rollback') {
    return { rows: [], rowCount: 0 };
  }

  // 2. RLS context initialization function call
  if (sqlLower.includes('set_user_id')) {
    // Usually: SELECT public.set_user_id($1)
    const match = sqlClean.match(/set_user_id\(\s*(\$\d+)\s*\)/i);
    if (match) {
      const userId = getParamValue(match[1], params);
      return { rows: [], rowCount: 0, setUserId: userId };
    }
    return { rows: [], rowCount: 0 };
  }

  // 3. SELECT Queries
  if (sqlLower.startsWith('select')) {
    // Extract table name
    const fromMatch = sqlClean.match(/from\s+([a-zA-Z0-9_\.]+)/i);
    if (!fromMatch) {
      // Direct SELECT without FROM (e.g. SELECT 1)
      if (sqlLower.includes('select 1')) {
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    const tableName = fromMatch[1];
    const Model = getModel(tableName);

    // Parse WHERE filter
    let filter = {};
    const whereMatch = sqlClean.match(/where\s+([\s\S]+?)(?:order\s+by|limit|offset|group\s+by|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      // Split on AND
      const conditions = whereClause.split(/\band\b/i);
      for (const cond of conditions) {
        const condClean = cond.trim();
        if (!condClean) continue;

        // Match lower(field) = lower($1)
        const lowerMatch = condClean.match(/lower\(([^)]+)\)\s*=\s*lower\((\$\d+)\)/i);
        if (lowerMatch) {
          const field = lowerMatch[1].trim().replace(/^\w+\./, ''); // remove table alias
          const val = getParamValue(lowerMatch[2], params);
          if (val !== undefined) {
            filter[field] = { $regex: new RegExp('^' + escapeRegExp(val) + '$', 'i') };
          }
          continue;
        }

        // Match field = ANY($1::int[]) or field = ANY($1)
        const anyMatch = condClean.match(/([\w\.]+)\s*=\s*any\s*\(([^)]+)\)/i);
        if (anyMatch) {
          const field = anyMatch[1].replace(/^\w+\./, '');
          const placeholder = anyMatch[2].replace(/::\w+\[\]/, '').trim();
          const val = getParamValue(placeholder, params);
          if (Array.isArray(val)) {
            filter[field] = { $in: val };
          }
          continue;
        }

        // Match field = $1
        const eqMatch = condClean.match(/([\w\.]+)\s*=\s*(\$\d+)/);
        if (eqMatch) {
          let field = eqMatch[1].replace(/^\w+\./, '');
          if (field === 'id') field = '_id'; // map PostgreSQL id to MongoDB _id
          const val = getParamValue(eqMatch[2], params);
          if (val !== undefined) {
            filter[field] = val;
          }
          continue;
        }

        // Match field != $1 or field <> $1
        const neMatch = condClean.match(/([\w\.]+)\s*(?:!=|<>)\s*(\$\d+)/);
        if (neMatch) {
          let field = neMatch[1].replace(/^\w+\./, '');
          if (field === 'id') field = '_id';
          const val = getParamValue(neMatch[2], params);
          if (val !== undefined) {
            filter[field] = { $ne: val };
          }
          continue;
        }

        // Match field IS NULL
        if (condClean.toUpperCase().endsWith('IS NULL')) {
          const field = condClean.replace(/\s+is\s+null/i, '').trim().replace(/^\w+\./, '');
          filter[field] = null;
          continue;
        }

        // Match field IS NOT NULL
        if (condClean.toUpperCase().endsWith('IS NOT NULL')) {
          const field = condClean.replace(/\s+is\s+not\s+null/i, '').trim().replace(/^\w+\./, '');
          filter[field] = { $ne: null };
          continue;
        }
      }
    }

    // Apply Row Level Security filters
    filter = applyRLS(tableName, filter, currentUserId);

    let queryObj = Model.find(filter);

    // Parse ORDER BY
    const orderMatch = sqlClean.match(/order\s+by\s+([a-zA-Z0-9_\.,\s]+)(?:limit|offset|$)/i);
    if (orderMatch) {
      const orderFields = orderMatch[1].split(',');
      const sort = {};
      for (const fieldExpr of orderFields) {
        const parts = fieldExpr.trim().split(/\s+/);
        let field = parts[0].replace(/^\w+\./, '');
        if (field === 'id') field = '_id';
        const direction = parts[1] && parts[1].toLowerCase() === 'desc' ? -1 : 1;
        sort[field] = direction;
      }
      queryObj = queryObj.sort(sort);
    }

    // Parse LIMIT
    const limitMatch = sqlClean.match(/limit\s+(\$\d+|\d+)/i);
    if (limitMatch) {
      let limitVal = limitMatch[1];
      if (limitVal.startsWith('$')) {
        limitVal = getParamValue(limitVal, params);
      } else {
        limitVal = parseInt(limitVal, 10);
      }
      if (typeof limitVal === 'number') {
        queryObj = queryObj.limit(limitVal);
      }
    }

    // Parse OFFSET
    const offsetMatch = sqlClean.match(/offset\s+(\$\d+|\d+)/i);
    if (offsetMatch) {
      let offsetVal = offsetMatch[1];
      if (offsetVal.startsWith('$')) {
        offsetVal = getParamValue(offsetVal, params);
      } else {
        offsetVal = parseInt(offsetVal, 10);
      }
      if (typeof offsetVal === 'number') {
        queryObj = queryObj.skip(offsetVal);
      }
    }

    let docs = await queryObj.lean();

    // Map _id back to id to match Postgres behavior
    docs = docs.map(doc => {
      return { id: doc._id, ...doc };
    });

    // Simulate JOINs
    docs = await handleJoins(tableName, docs);

    // Handle COUNT(*) or count aggregates
    if (sqlClean.toLowerCase().includes('count(')) {
      const total = await Model.countDocuments(filter);
      return { rows: [{ count: String(total), count_int: total }], rowCount: 1 };
    }

    return { rows: docs, rowCount: docs.length };
  }

  // 4. INSERT Queries
  if (sqlLower.startsWith('insert')) {
    const tableMatch = sqlClean.match(/insert\s+into\s+([a-zA-Z0-9_\.]+)/i);
    const tableName = tableMatch[1];
    const Model = getModel(tableName);

    // Extract columns and values
    const firstOpenParen = sqlClean.indexOf('(');
    const firstCloseParen = sqlClean.indexOf(')');
    if (firstOpenParen === -1 || firstCloseParen === -1 || firstCloseParen < firstOpenParen) {
      return { rows: [], rowCount: 0 };
    }
    const colsStr = sqlClean.substring(firstOpenParen + 1, firstCloseParen);
    const cols = colsStr.split(',').map(c => c.trim());

    const valuesIdx = sqlClean.toLowerCase().indexOf('values');
    if (valuesIdx === -1) {
      return { rows: [], rowCount: 0 };
    }
    const valuesSub = sqlClean.substring(valuesIdx + 6).trim(); // after 'values'
    let valOpenParen = valuesSub.indexOf('(');
    if (valOpenParen === -1) {
      return { rows: [], rowCount: 0 };
    }
    let balance = 1;
    let valCloseParen = -1;
    for (let i = valOpenParen + 1; i < valuesSub.length; i++) {
      if (valuesSub[i] === '(') balance++;
      else if (valuesSub[i] === ')') balance--;
      if (balance === 0) {
        valCloseParen = i;
        break;
      }
    }
    if (valCloseParen === -1) {
      return { rows: [], rowCount: 0 };
    }
    const valsStr = valuesSub.substring(valOpenParen + 1, valCloseParen);
    const valPlaceholders = splitByComma(valsStr);

    const doc = {};
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const placeholder = valPlaceholders[i] ? valPlaceholders[i].trim().toLowerCase() : '';
      let val;
      if (placeholder === 'now()' || placeholder === 'now') {
        val = new Date();
      } else {
        val = getParamValue(valPlaceholders[i], params);
      }
      if (col === 'id') {
        doc._id = val;
      }
      doc[col] = val;
    }
    if (!doc._id) {
      doc._id = new mongoose.Types.ObjectId().toString();
    }

    // ON CONFLICT DO UPDATE support
    if (sqlLower.includes('on conflict')) {
      const conflictMatch = sqlClean.match(/on\s+conflict\s*\((.+?)\)/i);
      const conflictKey = conflictMatch ? conflictMatch[1].trim() : 'id';
      const mongoConflictKey = conflictKey === 'id' ? '_id' : conflictKey;

      const queryFilter = {};
      queryFilter[mongoConflictKey] = doc[mongoConflictKey];

      // Perform upsert
      const updated = await Model.findOneAndUpdate(queryFilter, { $set: doc }, { upsert: true, new: true }).lean();
      const mapped = { id: updated._id, ...updated };
      return { rows: [mapped], rowCount: 1 };
    }

    const created = await Model.create(doc);
    const createdLean = created.toObject();
    const mapped = { id: createdLean._id, ...createdLean };
    return { rows: [mapped], rowCount: 1 };
  }

  // 5. UPDATE Queries
  if (sqlLower.startsWith('update')) {
    const tableMatch = sqlClean.match(/update\s+([a-zA-Z0-9_\.]+)/i);
    const tableName = tableMatch[1];
    const Model = getModel(tableName);

    // Extract SET clause and WHERE clause
    const setMatch = sqlClean.match(/set\s+([\s\S]+?)\s+where/i);
    const whereMatch = sqlClean.match(/where\s+([\s\S]+)$/i);

    if (!setMatch || !whereMatch) {
      return { rows: [], rowCount: 0 };
    }

    const setClause = setMatch[1];
    const whereClause = whereMatch[1];

    // Build filter
    let filter = {};
    const conditions = whereClause.split(/\band\b/i);
    for (const cond of conditions) {
      const condClean = cond.trim();
      const eqMatch = condClean.match(/([\w\.]+)\s*=\s*(\$\d+)/);
      if (eqMatch) {
        let field = eqMatch[1].replace(/^\w+\./, '');
        if (field === 'id') field = '_id';
        const val = getParamValue(eqMatch[2], params);
        filter[field] = val;
      }
    }

    filter = applyRLS(tableName, filter, currentUserId);

    // Fetch existing doc to handle COALESCE
    const existing = await Model.findOne(filter).lean();
    if (!existing) {
      return { rows: [], rowCount: 0 };
    }

    const assignments = splitByComma(setClause);
    const updates = {};

    for (const assign of assignments) {
      const parts = assign.split('=');
      if (parts.length < 2) continue;
      const field = parts[0].trim();
      const expr = parts[1].trim();

      // Check for COALESCE($1, field)
      if (expr.toLowerCase().includes('coalesce')) {
        const placeholderMatch = expr.match(/\$(\d+)/);
        if (placeholderMatch) {
          const val = getParamValue(placeholderMatch[0], params);
          if (val !== null && val !== undefined) {
            updates[field] = val;
          } else {
            // retain existing value
            updates[field] = existing[field];
          }
        }
      } else {
        const placeholderMatch = expr.match(/\$(\d+)/);
        if (placeholderMatch) {
          updates[field] = getParamValue(placeholderMatch[0], params);
        } else if (expr.toLowerCase() === 'now()' || expr.toLowerCase() === 'now') {
          updates[field] = new Date();
        } else {
          // literal value
          updates[field] = expr.replace(/'/g, '');
        }
      }
    }

    const updated = await Model.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
    if (!updated) {
      return { rows: [], rowCount: 0 };
    }
    const mapped = { id: updated._id, ...updated };
    return { rows: [mapped], rowCount: 1 };
  }

  // 6. DELETE Queries
  if (sqlLower.startsWith('delete')) {
    const tableMatch = sqlClean.match(/delete\s+from\s+([a-zA-Z0-9_\.]+)/i);
    const tableName = tableMatch[1];
    const Model = getModel(tableName);

    const whereMatch = sqlClean.match(/where\s+([\s\S]+)$/i);
    let filter = {};
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const conditions = whereClause.split(/\band\b/i);
      for (const cond of conditions) {
        const condClean = cond.trim();
        const eqMatch = condClean.match(/([\w\.]+)\s*=\s*(\$\d+)/);
        if (eqMatch) {
          let field = eqMatch[1].replace(/^\w+\./, '');
          if (field === 'id') field = '_id';
          const val = getParamValue(eqMatch[2], params);
          filter[field] = val;
        }
      }
    }

    filter = applyRLS(tableName, filter, currentUserId);

    const deleteResult = await Model.deleteMany(filter);
    return { rows: [], rowCount: deleteResult.deletedCount };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  executeSQL,
  connectToMongo
};
