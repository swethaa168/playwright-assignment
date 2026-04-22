import { test, expect } from '@playwright/test';
import data from './userData.json';

const baseURL = 'https://www.saucedemo.com/';

test.describe('SauceDemo Full Test Coverage', () => {

  // DATA DRIVEN NEGATIVE LOGIN CASES
  for (const scenario of data.loginFailures) {
    test(`Login Validation: ${scenario.error}`, async ({ page }) => {
      await page.goto(baseURL);
      if (scenario.user) await page.fill('#user-name', scenario.user);
      if (scenario.pass) await page.fill('#password', scenario.pass);
      await page.click('#login-button');

      await expect(page.locator('[data-test="error"]')).toContainText(scenario.error);
    });
  }

  // AUTHENTICATED FLOWS (Using BeforeEach for Navigation/Login)
  test.describe('Authenticated State Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await page.fill('#user-name', data.validUser.user);
      await page.fill('#password', data.validUser.pass);
      await page.click('#login-button');
      await expect(page).toHaveURL(/inventory/);
    });

    test('Inventory Page Load', async ({ page }) => {
      await expect(page.locator('.inventory_item')).not.toHaveCount(0);
    });

    test('Add Product to Cart', async ({ page }) => {
      await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    });

    test('Remove Product from Cart', async ({ page }) => {
      await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('button[data-test="remove-sauce-labs-backpack"]');
      await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
    });

    test('Navigate to Cart Page', async ({ page }) => {
      await page.click('.shopping_cart_link');
      await expect(page).toHaveURL(/cart/);
    });

    test('Checkout Process (Form Interaction)', async ({ page }) => {
      await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('.shopping_cart_link');
      await page.click('[data-test="checkout"]');

      // Interacting with form fields using JSON data
      await page.fill('#first-name', data.checkoutData.fname);
      await page.fill('#last-name', data.checkoutData.lname);
      await page.fill('#postal-code', data.checkoutData.zip);

      await page.click('[data-test="continue"]');
      await expect(page).toHaveURL(/checkout-step-two/);
      await page.click('[data-test="finish"]');

      await expect(page.locator('.complete-header')).toContainText('Thank you');
    });

    test('Checkout Validation (Empty Fields)', async ({ page }) => {
      await page.click('.shopping_cart_link');
      await page.click('[data-test="checkout"]');
      await page.click('[data-test="continue"]');

      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Error: First Name is required');
    });

    test('View Product Details', async ({ page }) => {
      await page.click('.inventory_item_name >> nth=0');
      await expect(page.locator('.inventory_details_name')).toBeVisible();
      await expect(page).toHaveURL(/inventory-item/);
    });

    test('Sort Products by Price Low to High', async ({ page }) => {
      await page.selectOption('.product_sort_container', 'lohi');
      const firstPrice = await page.locator('.inventory_item_price').first().innerText();
      // Verify sorting logic (lowest price is $7.99)
      expect(firstPrice).toBe('$7.99');
    });

    test('Logout', async ({ page }) => {
      await page.click('#react-burger-menu-btn');
      await page.click('#logout_sidebar_link');
      await expect(page).toHaveURL(baseURL);
    });
  });
});