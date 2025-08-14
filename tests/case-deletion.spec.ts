import { test, expect } from '@playwright/test';

test.describe('Case Deletion and Trash Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login as admin user
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/cases', { timeout: 10000 });
  });

  test('should soft-delete a case and move it to trash', async ({ page }) => {
    // Navigate to cases page
    await page.goto('/cases');
    
    // Wait for cases list to load
    await page.waitForSelector('[data-test="case-row"]', { timeout: 10000 });
    
    // Get initial case count
    const initialCases = await page.locator('[data-test="case-row"]').count();
    console.log(`Initial case count: ${initialCases}`);
    
    if (initialCases === 0) {
      // Create a test case if none exist
      await page.click('button:has-text("Create Case")');
      await page.fill('input[name="caseNumber"]', `TEST-${Date.now()}`);
      await page.fill('input[name="clientName"]', 'Test Client');
      await page.fill('input[name="atFaultPartyName"]', 'Test At Fault');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);
    }
    
    // Find the first case's delete button
    const firstCaseRow = page.locator('[data-test="case-row"]').first();
    const caseNumber = await firstCaseRow.locator('[data-test="case-number"]').textContent();
    console.log(`Deleting case: ${caseNumber}`);
    
    // Click delete button
    await firstCaseRow.locator('button[aria-label*="Delete"]').click();
    
    // Confirm deletion in dialog
    await page.click('button:has-text("Confirm")');
    
    // Wait for deletion to complete
    await page.waitForTimeout(3000);
    
    // Verify case is removed from list
    const remainingCases = await page.locator('[data-test="case-row"]').count();
    expect(remainingCases).toBe(initialCases - 1);
    
    // Verify case is not visible anymore
    const deletedCaseVisible = await page.locator(`text=${caseNumber}`).isVisible();
    expect(deletedCaseVisible).toBe(false);
  });

  test('should filter out deleted cases from main list', async ({ page }) => {
    // Navigate to cases page
    await page.goto('/cases');
    
    // Wait for cases list to load
    await page.waitForSelector('[data-test="case-row"]', { timeout: 10000 });
    
    // Check that no deleted cases are visible
    const visibleCases = await page.locator('[data-test="case-row"]').all();
    
    for (const caseRow of visibleCases) {
      // Each visible case should not have any deletion indicator
      const hasDeletedBadge = await caseRow.locator('.deleted-badge').count();
      expect(hasDeletedBadge).toBe(0);
    }
  });

  test('should verify database columns exist', async ({ page }) => {
    // Navigate to debug database page
    await page.goto('/debug-database');
    
    // Run database test
    await page.click('button:has-text("Run Database Test")');
    
    // Wait for results
    await page.waitForSelector('pre', { timeout: 10000 });
    
    // Get the JSON response
    const responseText = await page.locator('pre').textContent();
    const response = JSON.parse(responseText || '{}');
    
    // Verify is_deleted column exists
    const columns = response.columns_exist || [];
    const hasIsDeleted = columns.some((col: any) => col.column_name === 'is_deleted');
    const hasDeletedAt = columns.some((col: any) => col.column_name === 'deleted_at');
    
    expect(hasIsDeleted).toBe(true);
    expect(hasDeletedAt).toBe(true);
    
    console.log('Database columns verified:', {
      is_deleted: hasIsDeleted,
      deleted_at: hasDeletedAt,
      case_counts: response.case_counts
    });
  });

  test('should run migration if columns are missing', async ({ page }) => {
    // Navigate to debug database page
    await page.goto('/debug-database');
    
    // Run migration
    await page.click('button:has-text("Run Migration")');
    
    // Wait for results
    await page.waitForSelector('pre', { timeout: 15000 });
    
    // Get the JSON response
    const responseText = await page.locator('pre').textContent();
    const response = JSON.parse(responseText || '{}');
    
    // Verify migration success
    expect(response.success).toBe(true);
    
    console.log('Migration results:', {
      success: response.success,
      migrations: response.migrations,
      case_counts: response.case_counts
    });
  });

  test('should restore case from trash', async ({ page }) => {
    // This test assumes trash UI is implemented
    // Navigate to trash/deleted cases view
    await page.goto('/cases/trash');
    
    // Check if there are any deleted cases
    const deletedCases = await page.locator('[data-test="deleted-case-row"]').count();
    
    if (deletedCases > 0) {
      // Find the first deleted case
      const firstDeletedCase = page.locator('[data-test="deleted-case-row"]').first();
      const caseNumber = await firstDeletedCase.locator('[data-test="case-number"]').textContent();
      
      // Click restore button
      await firstDeletedCase.locator('button[aria-label*="Restore"]').click();
      
      // Wait for restoration
      await page.waitForTimeout(2000);
      
      // Navigate back to main cases list
      await page.goto('/cases');
      
      // Verify the case is back in the main list
      const restoredCase = await page.locator(`text=${caseNumber}`).isVisible();
      expect(restoredCase).toBe(true);
    }
  });

  test('should permanently delete case from trash', async ({ page }) => {
    // Navigate to trash/deleted cases view
    await page.goto('/cases/trash');
    
    // Check if empty trash button exists
    const emptyTrashButton = page.locator('button:has-text("Empty Trash")');
    
    if (await emptyTrashButton.isVisible()) {
      // Get count before emptying
      const beforeCount = await page.locator('[data-test="deleted-case-row"]').count();
      
      // Click empty trash
      await emptyTrashButton.click();
      
      // Confirm in dialog
      await page.click('button:has-text("Confirm")');
      
      // Wait for deletion
      await page.waitForTimeout(2000);
      
      // Verify trash is empty
      const afterCount = await page.locator('[data-test="deleted-case-row"]').count();
      expect(afterCount).toBe(0);
      
      console.log(`Emptied trash: ${beforeCount} cases permanently deleted`);
    }
  });
});