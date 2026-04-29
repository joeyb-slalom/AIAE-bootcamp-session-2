const { expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page.getByText('Calm TODO Planner')).toBeVisible();
  }

  async addTodo(title) {
    await this.page.getByLabel('Task title').fill(title);
    await this.page.getByRole('button', { name: 'Add TODO' }).click();
    await expect(this.page.locator(`input[value="${title}"]`)).toBeVisible();
  }

  async setTodoDueDate(title, dateValue) {
    const row = this.page.locator('.todo-row').filter({ has: this.page.locator(`input[value="${title}"]`) });
    await row.getByLabel('Due date').fill(dateValue);
    await expect(row.getByLabel('Due date')).toHaveValue(dateValue);
  }

  async completeTodo(title) {
    const row = this.page.locator('.todo-row').filter({ has: this.page.locator(`input[value="${title}"]`) });
    await row.getByRole('button', { name: 'Complete' }).click();
    await expect(row.getByRole('button', { name: 'Mark active' })).toBeVisible();
  }

  async deleteTodo(title) {
    const row = this.page.locator('.todo-row').filter({ has: this.page.locator(`input[value="${title}"]`) });
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(this.page.locator(`input[value="${title}"]`)).toHaveCount(0);
  }
}

module.exports = { TodoPage };
