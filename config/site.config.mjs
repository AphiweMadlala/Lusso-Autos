// Single source of deployment configuration. Environment variables override for CI.
export default {
  // Path the site is served under, e.g. '/Lusso-Autos/' on GitHub Pages or '/' on a custom domain.
  BASE_PATH: process.env.BASE_PATH ?? '/Lusso-Autos/',
  SITE_URL: process.env.SITE_URL ?? 'https://aphiwemadlala.github.io',
  // Proposal mode: noindex/nofollow on every page, robots.txt disallow, proposal banner in footer,
  // no analytics. Set PROPOSAL_MODE=false only after the client approves launch.
  PROPOSAL_MODE: (process.env.PROPOSAL_MODE ?? 'true') !== 'false',
};
