import type { Page } from '@playwright/test'

export async function addExpense(page: Page, date: string, amount: string, category: string) {
  await page.getByLabel('Date').fill(date)
  await page.getByLabel('Amount').fill(amount)
  await page.getByRole('combobox', { name: 'Category' }).selectOption(category)
  await page.getByRole('button', { name: 'Add expense' }).click()
}

export async function setMonthlyLimit(page: Page, amount: string) {
  await page.getByLabel('Monthly limit').fill(amount)
  await page.getByRole('button', { name: 'Set limit' }).click()
}
