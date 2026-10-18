/** Guard before any test account is created in the hosted Auth service. */
export function assertTestProject(
  url: string,
  reference: string | undefined,
): void {
  if (!reference || !/^[a-z0-9-]+$/.test(reference)) {
    throw new Error(
      "Confirme la référence du projet de test dans LITECODE_E2E_TEST_PROJECT_REF.",
    );
  }
  const target = new URL(url);
  if (
    target.origin !== `https://${reference}.supabase.co` ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    throw new Error(
      "L’URL Supabase ne correspond pas au projet de test HTTPS explicitement confirmé.",
    );
  }
}
