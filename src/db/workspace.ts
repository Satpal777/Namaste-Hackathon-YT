/**
 * The only tenant that exists in this build. Tenancy is a column from commit
 * #1 — cheap now, brutal to retrofit — but the workspace UI is Stage 3, so
 * every query goes through this constant instead.
 */
export const DEMO_WORKSPACE_ID = 'ws_demo';
