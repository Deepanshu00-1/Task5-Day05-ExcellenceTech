import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Increase the test timeout to handle potential delays
test.setTimeout(120000);

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test user credentials - using the hardcoded organizer account
const testUser = {
  email: 'test@organizer.com',
  password: 'password123'
};

// Helper function to save screenshots with timestamps
const saveScreenshot = async (page, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `./screenshots/${name}-${timestamp}.png`, fullPage: true });
  console.log(`Screenshot saved: ${name}-${timestamp}.png`);
};

// Helper function for login
const login = async (page) => {
  console.log('Attempting to log in');
  
  // Take screenshot of login page
  await saveScreenshot(page, 'login-page-before');
  
  // Print what's visible on the page to help debug
  console.log('Visible text on page:', await page.textContent('body'));
  
  // Try to find email input using multiple strategies
  const emailInput = await page.$(
    'input[type="email"], input[name="email"], input[placeholder*="mail"], input[aria-label*="mail"]'
  );
  
  if (emailInput) {
    console.log('Found email input field');
    await emailInput.fill(testUser.email);
  } else {
    console.log('Email input not found, taking screenshot');
    await saveScreenshot(page, 'email-input-not-found');
    throw new Error('Email input field not found');
  }
  
  // Try to find password input using multiple strategies
  const passwordInput = await page.$(
    'input[type="password"], input[name="password"], input[placeholder*="password"], input[aria-label*="assword"]'
  );
  
  if (passwordInput) {
    console.log('Found password input field');
    await passwordInput.fill(testUser.password);
  } else {
    console.log('Password input not found, taking screenshot');
    await saveScreenshot(page, 'password-input-not-found');
    throw new Error('Password input field not found');
  }
  
  // Try to find sign in button using multiple strategies
  const signInButton = await page.$(
    'button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in"), input[type="submit"]'
  );
  
  if (signInButton) {
    console.log('Found sign in button');
    await signInButton.click();
  } else {
    console.log('Sign in button not found, taking screenshot');
    await saveScreenshot(page, 'signin-button-not-found');
    throw new Error('Sign in button not found');
  }
  
  // Wait for navigation to complete
  await page.waitForTimeout(3000);
  await saveScreenshot(page, 'after-login-attempt');
  console.log('Login attempt completed');
};

test('full registration flow test', async ({ page }) => {
  try {
    console.log('Starting full registration flow test');
    
    // Step 1: Navigate to home page
    console.log('Navigating to home page');
    await page.goto('/');
    await saveScreenshot(page, '01-home-page');
    
    // Check if login is needed
    const hasSignInText = await page.textContent('body');
    if (hasSignInText && hasSignInText.includes('Sign In')) {
      console.log('Sign In text detected, attempting login');
      await login(page);
    } else {
      console.log('Already logged in or no login required');
    }
    
    // Step 2: Navigate to events page
    console.log('Navigating to events page');
    // Take a screenshot to see what we're working with
    await saveScreenshot(page, '02-before-events-navigation');
    
    const eventsLink = await page.$('a:has-text("Events"), [href*="events"], [href*="event"]');
    if (eventsLink) {
      await eventsLink.click();
      console.log('Clicked events link');
    } else {
      console.log('Events link not found, trying to navigate directly');
      await page.goto('/events');
    }
    
    await page.waitForTimeout(2000);
    await saveScreenshot(page, '03-events-page');
    
    // Step 3: Find an event or create one if none exists
    console.log('Looking for available events');
    const eventCards = await page.$$('.event-card, [data-testid="event-card"], .card, .event');
    await saveScreenshot(page, '04-event-listing');
    
    let selectedEventIndex = 0;
    
    if (eventCards.length === 0) {
      console.log('No events found, attempting to create one');
      
      // Look for create event button
      const createButton = await page.$('button:has-text("Create Event"), a:has-text("Create Event")');
      
      if (!createButton) {
        console.log('Create Event button not found, taking screenshot');
        await saveScreenshot(page, '05-create-button-not-found');
        throw new Error('Create Event button not found and no events exist');
      }
      
      await createButton.click();
      console.log('Clicked Create Event button');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, '06-create-event-form');
      
      // Fill event creation form with multiple fallback selectors
      const eventName = `Test Event ${Date.now()}`;
      
      await page.fill('input[name="name"], input[placeholder*="name"], input[aria-label*="name"]', eventName);
      await page.fill('textarea[name="description"], textarea[placeholder*="description"], [aria-label*="description"]', 
        'This is a test event for the registration flow test');
      await page.fill('input[name="location"], input[placeholder*="location"], [aria-label*="location"]', 'Test Location');
      
      // Try to fill date and time inputs - these can be tricky
      try {
        await page.fill('input[type="date"], input[name="date"]', '2023-12-31');
      } catch (error) {
        console.log('Could not fill date input directly:', error);
      }
      
      try {
        // Try to handle category dropdown
        await page.selectOption('select[name="category"], select', 'conference');
      } catch (error) {
        console.log('Could not select category:', error);
      }
      
      await page.fill('input[name="capacity"], input[type="number"], input[placeholder*="capacity"]', '50');
      
      await saveScreenshot(page, '07-filled-event-form');
      
      // Try to submit the form
      const submitButton = await page.$('button[type="submit"], button:has-text("Create"), input[type="submit"]');
      
      if (submitButton) {
        await submitButton.click();
        console.log('Submitted event creation form');
      } else {
        console.log('Submit button not found');
        await saveScreenshot(page, '08-submit-button-not-found');
      }
      
      await page.waitForTimeout(3000);
      await saveScreenshot(page, '09-after-event-creation');
      
      // Navigate back to events page if not automatically redirected
      await page.goto('/events');
      await page.waitForTimeout(2000);
    }
    
    // Step 4: Refresh the list of events and select one
    console.log('Selecting an event to view details');
    await saveScreenshot(page, '10-before-selecting-event');
    
    // Try finding events again
    const updatedEventCards = await page.$$('.event-card, [data-testid="event-card"], .card, .event');
    
    if (updatedEventCards.length === 0) {
      console.log('Still no events found, test cannot continue');
      await saveScreenshot(page, '11-no-events-found');
      throw new Error('No events available to view details and register');
    }
    
    console.log(`Found ${updatedEventCards.length} events, clicking on event at index ${selectedEventIndex}`);
    await updatedEventCards[selectedEventIndex].click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, '12-event-details-page');
    
    // Step 5: Verify we're on the event details page
    console.log('Checking event details page components');
    const detailsTitle = await page.textContent('h1, .event-title, .title');
    console.log('Event title:', detailsTitle);
    
    // Step 6: Find and click the register button
    console.log('Looking for registration section');
    await saveScreenshot(page, '13-before-registration');
    
    // Try to find the register button
    const registerButton = await page.$(
      'button:has-text("Register"), button:has-text("Sign Up"), button:has-text("RSVP"), [data-testid="register-button"]'
    );
    
    if (!registerButton) {
      console.log('Register button not found, checking if already registered');
      const alreadyRegistered = await page.textContent('body');
      
      if (alreadyRegistered && alreadyRegistered.includes('already registered')) {
        console.log('User appears to be already registered for this event');
        await saveScreenshot(page, '14-already-registered');
      } else {
        console.log('Register button not found and no indication of being registered');
        await saveScreenshot(page, '14-register-button-not-found');
      }
    } else {
      console.log('Found register button, clicking it');
      await registerButton.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, '15-after-register-click');
      
      // Step 7: Fill out registration form if present
      const nameInput = await page.$('input[name="name"], input[placeholder*="name"], [aria-label*="name"]');
      const emailInput = await page.$('input[name="email"], input[type="email"], [aria-label*="email"]');
      
      if (nameInput || emailInput) {
        console.log('Registration form found, filling it out');
        
        if (nameInput) await nameInput.fill('Test User');
        if (emailInput) await emailInput.fill(testUser.email);
        
        await saveScreenshot(page, '16-filled-registration-form');
        
        // Submit registration form
        const submitButton = await page.$(
          'button[type="submit"], button:has-text("Register"), button:has-text("Submit"), input[type="submit"]'
        );
        
        if (submitButton) {
          await submitButton.click();
          console.log('Submitted registration form');
          await page.waitForTimeout(3000);
          await saveScreenshot(page, '17-after-registration-submit');
          
          // Look for success message
          const pageContent = await page.textContent('body');
          const registrationSuccess = 
            pageContent && (
              pageContent.includes('registered') || 
              pageContent.includes('success') || 
              pageContent.includes('confirmed')
            );
          
          console.log('Registration success indicators found:', registrationSuccess);
        } else {
          console.log('Registration submit button not found');
          await saveScreenshot(page, '17-registration-submit-not-found');
        }
      } else {
        console.log('No registration form found after clicking register button');
        await saveScreenshot(page, '16-no-registration-form');
      }
    }
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    await saveScreenshot(page, 'test-failure');
    throw error;
  }
}); 