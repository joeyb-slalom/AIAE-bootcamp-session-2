const request = require('supertest');
const { app } = require('../../src/app');

describe('TODO API integration', () => {
  it('creates, updates, filters, and deletes a TODO', async () => {
    const createResponse = await request(app)
      .post('/api/todos')
      .send({ title: 'Write integration test', dueDate: '2026-05-10' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      title: 'Write integration test',
      completed: false,
      dueDate: '2026-05-10',
    });

    const todoId = createResponse.body.id;

    const updateResponse = await request(app)
      .patch(`/api/todos/${todoId}`)
      .send({ completed: true, title: 'Write stronger integration test' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: todoId,
      title: 'Write stronger integration test',
      completed: true,
      dueDate: '2026-05-10',
    });

    const completedTodos = await request(app).get('/api/todos?status=completed&dueDate=with-due-date');

    expect(completedTodos.status).toBe(200);
    expect(completedTodos.body.some((todo) => todo.id === todoId)).toBe(true);

    const deleteResponse = await request(app).delete(`/api/todos/${todoId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'TODO deleted successfully',
      id: todoId,
    });
  });

  it('returns validation error for invalid due date', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: 'Bad due date', dueDate: '05-10-2026' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid due date format');
  });

  it('returns not found for updating unknown TODO', async () => {
    const response = await request(app)
      .patch('/api/todos/999999')
      .send({ completed: true });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'TODO not found' });
  });

  it('clears completed TODOs without affecting active TODOs', async () => {
    const activeCreate = await request(app)
      .post('/api/todos')
      .send({ title: 'Stay active' });
    const completedCreate = await request(app)
      .post('/api/todos')
      .send({ title: 'Remove me' });

    await request(app)
      .patch(`/api/todos/${completedCreate.body.id}`)
      .send({ completed: true });

    const clearResponse = await request(app).delete('/api/todos/completed');
    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.cleared).toBeGreaterThanOrEqual(1);

    const allTodos = await request(app).get('/api/todos');
    expect(allTodos.status).toBe(200);
    expect(allTodos.body.some((todo) => todo.id === completedCreate.body.id)).toBe(false);
    expect(allTodos.body.some((todo) => todo.id === activeCreate.body.id)).toBe(true);
  });
});
