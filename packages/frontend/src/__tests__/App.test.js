import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock server to intercept API requests
const server = setupServer(
  // GET /api/todos handler
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: 'Test Todo 1',
          completed: false,
          dueDate: '2026-04-30',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
        {
          id: 2,
          title: 'Test Todo 2',
          completed: true,
          dueDate: null,
          createdAt: '2026-04-02T00:00:00.000Z',
          updatedAt: '2026-04-02T00:00:00.000Z',
        },
      ])
    );
  }),

  // POST /api/todos handler
  rest.post('/api/todos', (req, res, ctx) => {
    const { title, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Title is required' })
      );
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title,
        completed: false,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  // PATCH /api/todos/:id handler
  rest.patch('/api/todos/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(id),
        title: req.body.title || 'Test Todo',
        completed: Boolean(req.body.completed),
        dueDate: req.body.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  // DELETE /api/todos/:id handler
  rest.delete('/api/todos/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'TODO deleted successfully', id: Number(req.params.id) }));
  }),

  // DELETE /api/todos/completed handler
  rest.delete('/api/todos/completed', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ cleared: 1 }));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the TODO app header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Calm TODO Planner')).toBeInTheDocument();
    expect(screen.getByText(/Capture tasks, choose due dates/)).toBeInTheDocument();
  });

  test('loads and displays TODO items', async () => {
    await act(async () => {
      render(<App />);
    });

    // Initially shows loading state
    expect(screen.getByText('Loading TODOs...')).toBeInTheDocument();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Todo 2')).toBeInTheDocument();
    });
  });

  test('adds a new TODO item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByText('Loading TODOs...')).not.toBeInTheDocument();
    });

    // Fill in the form and submit
    const input = screen.getByPlaceholderText('Plan sprint review');
    await act(async () => {
      await user.type(input, 'New Test Todo');
    });

    const submitButton = screen.getByRole('button', { name: 'Add TODO' });
    await act(async () => {
      await user.click(submitButton);
    });

    // Check that the new item appears
    await waitFor(() => {
      expect(screen.getByDisplayValue('New Test Todo')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    // Override the default handler to simulate an error
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch TODOs/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no TODO items', async () => {
    // Override the default handler to return empty array
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText('No TODOs found for the selected filters.')).toBeInTheDocument();
    });
  });
});