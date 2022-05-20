import env from 'env-var';
export const projectStrings = {
  name: env.get('SITE_TITLE').default("Crimes of Solidarity and Humanitarianism").asString(),
  description: env.get('SITE_DESCRIPTION').default("Documenting legal cases against people helping irregular migrants, known as crimes of solidarity and humanitarianism.").asString(),
  baseUrl: env.get('SITE_BASE_URL').default("https://gameworkersolidarity.com").asString(),
  twitterHandle: env.get('TWITTER_HANDLE').default('@GWSolidarity').asString(),
  email: env.get('EMAIL_ADDRESS').default('l.mayblin@sheffield.ac.uk').asString(),
  github: env.get('GITHUB_REPO_URL').default('https://github.com/gameworkersolidarity/website').asString(),
}