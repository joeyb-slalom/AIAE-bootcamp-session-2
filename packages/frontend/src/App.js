import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import './App.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const DUE_DATE_FILTERS = [
  { value: 'all', label: 'All dates' },
  { value: 'with-due-date', label: 'With due date' },
  { value: 'without-due-date', label: 'Without due date' },
];

function formatDate(value) {
  if (!value) {
    return 'No due date';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');

  useEffect(() => {
    fetchTodos();
  }, [statusFilter, dueDateFilter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        dueDate: dueDateFilter,
      });
      const response = await fetch(`/api/todos?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTodos(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch TODOs: ' + err.message);
      console.error('Error fetching TODOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    try {
      const payload = { title: newTitle.trim() };
      if (newDueDate) {
        payload.dueDate = newDueDate;
      }

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to add TODO');
      }

      const result = await response.json();
      setTodos([result, ...todos]);
      setNewTitle('');
      setNewDueDate('');
      setError(null);
    } catch (err) {
      setError('Error adding TODO: ' + err.message);
      console.error('Error adding TODO:', err);
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to update TODO');
      }

      const updated = await response.json();
      setTodos(todos.map((todo) => (todo.id === id ? updated : todo)));
      setError(null);
    } catch (err) {
      setError('Error updating TODO: ' + err.message);
      console.error('Error updating TODO:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to delete TODO');
      }

      setTodos(todos.filter((todo) => todo.id !== id));
      setError(null);
    } catch (err) {
      setError('Error deleting TODO: ' + err.message);
      console.error('Error deleting TODO:', err);
    }
  };

  const clearCompleted = async () => {
    try {
      const response = await fetch('/api/todos/completed', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear completed TODOs');
      }

      setTodos(todos.filter((todo) => !todo.completed));
      setError(null);
    } catch (err) {
      setError('Error clearing completed TODOs: ' + err.message);
    }
  };

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );

  const hasTodos = todos.length > 0;

  const handleDueDateChange = (id, value) => {
    updateTodo(id, { dueDate: value || null });
  };

  const toggleCompleted = (todo) => {
    updateTodo(todo.id, { completed: !todo.completed });
  };

  const updateTitle = (id, value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    updateTodo(id, { title: trimmed });
  };

  return (
    <Box className="app-shell">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Paper elevation={0} className="hero-panel" sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="h3" component="h1" className="hero-title" gutterBottom>
            Calm TODO Planner
          </Typography>
          <Typography variant="body1" className="hero-subtitle">
            Capture tasks, choose due dates, and keep momentum with focused lists.
          </Typography>
        </Paper>

        <Paper elevation={1} className="panel" sx={{ mt: 3, p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Add a task
          </Typography>
          <Stack component="form" onSubmit={addTodo} spacing={2} direction={{ xs: 'column', md: 'row' }}>
            <TextField
              fullWidth
              label="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Plan sprint review"
              required
            />
            <TextField
              label="Due date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button type="submit" variant="contained" size="large">
              Add TODO
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={1} className="panel" sx={{ mt: 3, p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <Typography variant="h6" component="h2">
              Tasks
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTERS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="due-date-filter-label">Due date</InputLabel>
                <Select
                  labelId="due-date-filter-label"
                  label="Due date"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                >
                  {DUE_DATE_FILTERS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 1 }}>
            <Chip label={`Total: ${todos.length}`} />
            <Chip label={`Completed: ${completedCount}`} color="success" variant="outlined" />
          </Stack>

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {loading && <Typography sx={{ mt: 2 }}>Loading TODOs...</Typography>}

          {!loading && !hasTodos && (
            <Typography sx={{ mt: 2 }}>
              No TODOs found for the selected filters.
            </Typography>
          )}

          {!loading && hasTodos && (
            <List sx={{ mt: 1 }}>
              {todos.map((todo) => (
                <ListItem
                  key={todo.id}
                  className="todo-row"
                  secondaryAction={
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button
                        size="small"
                        variant={todo.completed ? 'outlined' : 'contained'}
                        color={todo.completed ? 'secondary' : 'success'}
                        onClick={() => toggleCompleted(todo)}
                      >
                        {todo.completed ? 'Mark active' : 'Complete'}
                      </Button>
                      <Button size="small" color="error" onClick={() => deleteTodo(todo.id)}>
                        Delete
                      </Button>
                    </Stack>
                  }
                >
                  <Stack spacing={1.25} sx={{ width: '100%', pr: { xs: 0, sm: 2 } }}>
                    <TextField
                      size="small"
                      value={todo.title}
                      onChange={(e) => {
                        const nextTodos = todos.map((current) =>
                          current.id === todo.id ? { ...current, title: e.target.value } : current
                        );
                        setTodos(nextTodos);
                      }}
                      onBlur={(e) => updateTitle(todo.id, e.target.value)}
                      inputProps={{ 'aria-label': `Title for task ${todo.id}` }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <TextField
                        size="small"
                        type="date"
                        label="Due date"
                        value={todo.dueDate || ''}
                        onChange={(e) => handleDueDateChange(todo.id, e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <ListItemText
                        primary={todo.completed ? 'Completed' : 'Active'}
                        secondary={formatDate(todo.dueDate)}
                      />
                    </Stack>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}

          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            color="warning"
            onClick={clearCompleted}
            disabled={completedCount === 0}
          >
            Clear completed
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;