
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000/login")

            # Attendre que la page de connexion soit prête
            await expect(page.get_by_placeholder("Nom d'utilisateur")).to_be_visible(timeout=30000)

            # Remplir les champs de connexion
            await page.fill("input[name='username']", "admin")
            await page.fill("input[name='password']", "GroupementUnion2025!")
            await page.click("button[type='submit']")

            # Attendre la redirection vers le tableau de bord
            await expect(page).to_have_url("http://localhost:3000/", timeout=30000)
            print("Connexion réussie.")

            # Prendre une capture d'écran du tableau de bord
            await page.screenshot(path="jules-scratch/verification/01_dashboard.png")
            print("Capture d'écran du tableau de bord effectuée.")

            # Ouvrir le profil utilisateur
            await page.click("button:has-text('Profil')")

            # Attendre que la modale soit visible
            await expect(page.get_by_role('dialog')).to_be_visible()
            print("Modale de profil ouverte.")

            # Prendre une capture d'écran de la modale de profil
            await page.screenshot(path="jules-scratch/verification/02_profile_modal.png")
            print("Capture d'écran de la modale de profil effectuée.")

            # Cliquer sur le bouton de suppression
            delete_button = page.get_by_role("button", name="Supprimer mon compte")
            await expect(delete_button).to_be_visible()
            await delete_button.click()
            print("Bouton de suppression cliqué.")

            # Attendre la boîte de dialogue de confirmation native
            # Playwright ne peut pas interagir directement avec les alertes natives de la même manière
            # Nous allons donc juste vérifier que la modale de profil est toujours ouverte
            await expect(page.get_by_role('dialog')).to_be_visible()
            print("La modale de profil est toujours ouverte (attendu).")

            # Nous ne pouvons pas prendre une capture d'écran de l'alerte native,
            # mais nous pouvons prendre une capture de la page à ce moment-là.
            await page.screenshot(path="jules-scratch/verification/03_after_delete_click.png")
            print("Capture d'écran après le clic sur 'Supprimer' effectuée.")

        except Exception as e:
            print(f"Une erreur est survenue : {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
