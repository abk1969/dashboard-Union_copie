import os
from playwright.sync_api import sync_playwright, expect

# Set environment variables for the test
os.environ['REACT_APP_ADMIN_USERNAME'] = 'test'
os.environ['REACT_APP_ADMIN_PASSWORD'] = 'test'

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the login page to load
        expect(page.get_by_placeholder("Nom d'utilisateur")).to_be_visible()
        expect(page.get_by_placeholder("Mot de passe")).to_be_visible()

        # Fill in the login form
        page.get_by_placeholder("Nom d'utilisateur").fill(os.environ['REACT_APP_ADMIN_USERNAME'])
        page.get_by_placeholder("Mot de passe").fill(os.environ['REACT_APP_ADMIN_PASSWORD'])

        # Click the login button
        page.get_by_role("button", name="Se connecter").click()

        # Wait for the dashboard to load
        expect(page.get_by_text("Dashboard Union")).to_be_visible()

        # Take a screenshot of the dashboard
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
