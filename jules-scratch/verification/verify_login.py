from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:3000/login")

        # Fill in the credentials
        page.get_by_label("Email").fill("admin")
        page.get_by_label("Mot de passe").fill("GroupementUnion2025!")

        # Click the login button
        page.get_by_role("button", name="Se connecter").click()

        # Wait for navigation to the dashboard and check for a key element
        # This confirms a successful login
        expect(page.get_by_text("Tableau de bord")).to_be_visible(timeout=10000)

        # Take a screenshot of the dashboard
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Verification successful, screenshot saved.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)
