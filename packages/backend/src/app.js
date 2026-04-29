const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const createTodoStmt = db.prepare(
  'INSERT INTO todos (title, completed, due_date) VALUES (?, 0, ?)'
);
const getTodoByIdStmt = db.prepare('SELECT * FROM todos WHERE id = ?');
const deleteTodoStmt = db.prepare('DELETE FROM todos WHERE id = ?');
const clearCompletedStmt = db.prepare('DELETE FROM todos WHERE completed = 1');

function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

function normalizeDueDateInput(dueDate) {
  if (dueDate === undefined) {
    return { hasValue: false, value: null };
  }

  if (dueDate === null || dueDate === '') {
    return { hasValue: true, value: null };
  }

  if (typeof dueDate !== 'string') {
    return { error: 'Due date must be a string in YYYY-MM-DD format, null, or omitted' };
  }

  const trimmed = dueDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { error: 'Invalid due date format. Use YYYY-MM-DD' };
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return { error: 'Invalid due date format. Use YYYY-MM-DD' };
  }

  if (date.toISOString().slice(0, 10) !== trimmed) {
    return { error: 'Invalid due date value' };
  }

  return { hasValue: true, value: trimmed };
}

function mapTodoRow(row) {
  if (!row) {
    return row;
  }

  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

console.log('In-memory TODO database initialized');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// TODO API routes
app.get('/api/todos', (req, res) => {
  try {
    const { status = 'all', dueDate = 'all' } = req.query;
    const where = [];

    if (status === 'active') {
      where.push('completed = 0');
    } else if (status === 'completed') {
      where.push('completed = 1');
    } else if (status !== 'all') {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    if (dueDate === 'with-due-date') {
      where.push('due_date IS NOT NULL');
    } else if (dueDate === 'without-due-date') {
      where.push('due_date IS NULL');
    } else if (dueDate !== 'all') {
      return res.status(400).json({ error: 'Invalid dueDate filter' });
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const query = `
      SELECT id, title, completed, due_date, created_at, updated_at
      FROM todos
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const rows = db.prepare(query).all();
    res.json(rows.map(mapTodoRow));
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!isValidTitle(title)) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const normalizedDueDate = normalizeDueDateInput(dueDate);
    if (normalizedDueDate.error) {
      return res.status(400).json({ error: normalizedDueDate.error });
    }

    const result = createTodoStmt.run(title.trim(), normalizedDueDate.value);
    const id = result.lastInsertRowid;
    const newTodo = getTodoByIdStmt.get(id);

    res.status(201).json(mapTodoRow(newTodo));
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, dueDate } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid todo ID is required' });
    }

    const existingTodo = getTodoByIdStmt.get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'TODO not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      if (!isValidTitle(title)) {
        return res.status(400).json({ error: 'Title is required' });
      }
      updates.push('title = ?');
      values.push(title.trim());
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
      }
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (dueDate !== undefined) {
      const normalizedDueDate = normalizeDueDateInput(dueDate);
      if (normalizedDueDate.error) {
        return res.status(400).json({ error: normalizedDueDate.error });
      }
      updates.push('due_date = ?');
      values.push(normalizedDueDate.value);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateStmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);
    updateStmt.run(...values);

    const updatedTodo = getTodoByIdStmt.get(id);
    res.json(mapTodoRow(updatedTodo));
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/completed', (req, res) => {
  try {
    const result = clearCompletedStmt.run();
    res.json({ cleared: result.changes });
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid todo ID is required' });
    }

    const existingTodo = getTodoByIdStmt.get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'TODO not found' });
    }

    const result = deleteTodoStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'TODO deleted successfully', id: parseInt(id, 10) });
    } else {
      res.status(404).json({ error: 'TODO not found' });
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = {
  app,
  db,
  validators: {
    isValidTitle,
    normalizeDueDateInput,
  },
};