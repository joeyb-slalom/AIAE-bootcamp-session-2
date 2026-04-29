import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('Add a task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Plan sprint review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add TODO' })).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  test('loads and displays TODO items', async () => {
    await act(async () => {
      render(<App />);
    });

    // Initially shows loading state
    expect(screen.getByText('Loading TODOs...')).toBeInTheDocument();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByText('Loading TODOs...')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Todo 2')).toBeInTheDocument();
    });

    expect(screen.queryByText('No TODOs found for the selected filters.')).not.toBeInTheDocument();
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();
  });

  test('adds a new TODO item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByText('Loading TODOs...')).not.toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
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

    expect(screen.getByPlaceholderText('Plan sprint review')).toHaveValue('');
    expect(screen.getByText('Total: 3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Complete' }).length).toBeGreaterThan(0);
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
      expect(screen.queryByText('Loading TODOs...')).not.toBeInTheDocument();
    });

    expect(screen.queryByDisplayValue('Test Todo 1')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test Todo 2')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading TODOs...')).not.toBeInTheDocument();
    });

    expect(screen.queryByDisplayValue('Test Todo 1')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test Todo 2')).not.toBeInTheDocument();
    expect(screen.getByText('Total: 0')).toBeInTheDocument();
    expect(screen.getByText('Completed: 0')).toBeInTheDocument();
  });

  test('updates TODO title on blur', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    const titleInput = await screen.findByDisplayValue('Test Todo 1');
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Todo Title');
      await user.tab();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated Todo Title')).toBeInTheDocument();
    });
  });

  test('toggles completed state and updates summary chip', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Completed: 1')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: 'Complete' })[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Completed: 2')).toBeInTheDocument();
    });
  });

  test('updates due date field', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo 1')).toBeInTheDocument();
    });

    const todoDueDateInput = screen.getByDisplayValue('2026-04-30');

    fireEvent.change(todoDueDateInput, { target: { value: '2026-05-20' } });

    await waitFor(() => {
      expect(todoDueDateInput).toHaveValue('2026-05-20');
    });
  });

  test('deletes a TODO and updates total count', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    });

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Test Todo 1')).not.toBeInTheDocument();
      expect(screen.getByText('Total: 1')).toBeInTheDocument();
    });
  });

  test('clears completed TODOs when clear button is clicked', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Completed: 1')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: 'Clear completed' });
    expect(clearButton).toBeEnabled();

    await act(async () => {
      await user.click(clearButton);
    });

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Test Todo 2')).not.toBeInTheDocument();
      expect(screen.getByText('Completed: 0')).toBeInTheDocument();
    });
  });

  test('applies status and due date filters', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        const status = req.url.searchParams.get('status');
        const dueDate = req.url.searchParams.get('dueDate');

        if (status === 'completed') {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 99,
                title: 'Only Completed',
                completed: true,
                dueDate: '2026-06-01',
                createdAt: '2026-06-01T00:00:00.000Z',
                updatedAt: '2026-06-01T00:00:00.000Z',
              },
            ])
          );
        }

        if (dueDate === 'without-due-date') {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 100,
                title: 'No Due Date Item',
                completed: false,
                dueDate: null,
                createdAt: '2026-06-02T00:00:00.000Z',
                updatedAt: '2026-06-02T00:00:00.000Z',
              },
            ])
          );
        }

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
          ])
        );
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Todo 1')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByText('Completed'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Only Completed')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByText('All'));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Due date' }));
    await user.click(await screen.findByText('Without due date'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('No Due Date Item')).toBeInTheDocument();
    });
  });
});