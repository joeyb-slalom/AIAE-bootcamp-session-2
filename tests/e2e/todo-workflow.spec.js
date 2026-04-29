const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO workflow', () => {
  test('adds, completes, filters, and deletes a TODO', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = 'Prepare roadmap update';

    await todoPage.goto();
    await todoPage.addTodo(title);
    await todoPage.setTodoDueDate(title, '2026-05-15');

    await todoPage.completeTodo(title);

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Completed' }).click();

    await expect(page.locator(`input[value="${title}"]`)).toBeVisible();

    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(page.locator(`input[value="${title}"]`)).toHaveCount(0);
  });
});
