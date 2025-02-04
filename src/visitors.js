const { pool } = require("./connect.js");

const visitorQueries = { 
  addNewVisitor: `INSERT INTO visitors 
    (name, age, date_of_visit, time_of_visit, assistant, comments) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *`,

  listAllVisitors: `SELECT id, name FROM visitors`,

  deleteVisitor: `DELETE FROM visitors WHERE id = $1`,

  deleteAllVisitors: `DELETE FROM visitors`,

  updateVisitor: (columnToUpdate) => {
    return `UPDATE visitors SET ${columnToUpdate}=$1 WHERE id=$2`;
  },

  viewVisitor: `SELECT * FROM visitors WHERE id = $1`,

  viewLastVisitor: `SELECT * FROM visitors ORDER BY id DESC LIMIT 1;`,

  createTableQuery: `
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      age INT NOT NULL,
      date_of_visit DATE NOT NULL,
      time_of_visit TIME NOT NULL,
      assistant TEXT NOT NULL,
      comments TEXT NOT NULL
    );
  `,
};

const querySuccess = {
  tableCreated: `Visitors table created successfully.`,
  visitorDeleted: (id) => `Visitor with ${id} deleted successfully.`,
  allVisitorsDeleted: `All visitors deleted successfully.`,
};

const regex = /[a-zA-Z]/;

const queryError = {
  visitorNotFound: (id) => `Visitor with ${id} not found.`,
  noVisitors: `No visitors to delete.`,
};

const validationErrorMessages = {
  invalidName: "Invalid 'name': must be a non-empty string of letters only.",
  invalidAge: "Invalid 'age': must be a number.",
  invalidDateOfVisit: "Invalid 'dateOfVisit': must be nonempty.",
  invalidTimeOfVisit: "Invalid 'timeOfVisit': must be nonempty.",
  invalidAssistant: "Invalid 'assistant': must be a non-empty string.",
  invalidComments: "Invalid 'comments': must be a string.",
};

function validateInput(
  name,
  age,
  dateOfVisit,
  timeOfVisit,
  assistant,
  comments
) {
  if (!name || typeof name !== "string" || !regex.test(name)) {
    throw new Error(validationErrorMessages.invalidName);
  }

  if (!age || typeof age !== "number" || age <= 0) {
    throw new Error(validationErrorMessages.invalidAge);
  }

  if (!dateOfVisit) {
    throw new Error(validationErrorMessages.invalidDateOfVisit);
  }

  if (!timeOfVisit) {
    throw new Error(validationErrorMessages.invalidTimeOfVisit);
  }

  if (!assistant || typeof assistant !== "string" || !regex.test(assistant)) {
    throw new Error(validationErrorMessages.invalidAssistant);
  }

  if (!comments || typeof comments !== "string") {
    throw new Error(validationErrorMessages.invalidComments);
  }
}

async function idExists(id) {
  const result = await pool.query(visitorQueries.viewVisitor, [id]);
  return result.rows.length !== 0;
}

async function createTable() {
  await pool.query(visitorQueries.createTableQuery);
  return querySuccess.tableCreated;
}

async function addNewVisitor(visitor) {
  const { name, age, dateOfVisit, timeOfVisit, assistant, comments } = visitor;

  validateInput(name, age, dateOfVisit, timeOfVisit, assistant, comments);

  const result = await pool.query(`${visitorQueries.addNewVisitor}`, [
    name,
    age,
    dateOfVisit,
    timeOfVisit,
    assistant,
    comments,
  ]);
  return result.rows[0].id;
}

async function listAllVisitors() {
  return await pool
    .query(visitorQueries.listAllVisitors)
    .then((res) => res.rows);
}

async function deleteVisitor(id) {
  if (!(await idExists(id))) {
    throw new Error(queryError.visitorNotFound(id));
  }
  await pool.query(visitorQueries.deleteVisitor, [id]);
  return querySuccess.visitorDeleted(id);
}

async function deleteAllVisitors() {
  if ((await listAllVisitors()).length === 0) {
    throw new Error(queryError.noVisitors);
  }
  await pool.query(visitorQueries.deleteAllVisitors);
  return querySuccess.allVisitorsDeleted;
}

async function updateVisitor(id, columnToUpdate, newValue) {
  if (!(await idExists(id))) {
    throw new Error(queryError.visitorNotFound(id));
  }

  const validColumns = [
    "name",
    "age",
    "date_of_visit",
    "time_of_visit",
    "assistant",
    "comments",
  ];
  if (!validColumns.includes(columnToUpdate)) {
    throw new Error(`Invalid column name: ${columnToUpdate}`);
  }

  const updateQuery = visitorQueries.updateVisitor(columnToUpdate);

  return await pool
    .query(updateQuery, [newValue, id])
    .then((res) => res.rowCount);
}

async function viewVisitor(id) {
  if (!(await idExists(id))) {
    throw new Error(queryError.visitorNotFound(id));
  }
  return await pool
    .query(visitorQueries.viewVisitor, [id])
    .then((res) => res.rows);
}

async function viewLastVisitor() {
  const result = await pool.query(visitorQueries.viewLastVisitor);
  if (result.rows.length === 0) {
    throw new Error(queryError.visitorNotFound);
  }
  return result.rows[0].id;
}

module.exports = {
  createTable,
  addNewVisitor,
  listAllVisitors,
  deleteAllVisitors,
  deleteVisitor,
  updateVisitor,
  viewVisitor,
  viewLastVisitor,
  visitorQueries,
  querySuccess,
  queryError,
  validationErrorMessages,
  validateInput,
};
