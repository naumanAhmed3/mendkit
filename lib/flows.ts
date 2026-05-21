import type { Flow, FlowStep } from './types';

// ─────────────────────────────────────────────────────────────
// Sample flows. The first two drive the bundled mutating target
// (/target) and are authored against its pristine v0 markup — so any
// run against a mutated version exercises self-healing. The third
// drives a real public site, showing the resilient locators work
// off-mock too (it simply never needs to heal there).
// ─────────────────────────────────────────────────────────────

interface FlowSeed {
  id: string;
  name: string;
  description: string;
  startUrl: string;
  steps: FlowStep[];
}

const SEEDS: FlowSeed[] = [
  {
    id: 'access-console-audit',
    name: 'Access Console · member directory audit',
    description:
      'Opens the team access console, asserts it loaded, searches the member directory, reads the member count, and exports the list. Authored against the pristine markup — every selector here will be tested by mutation.',
    startUrl: '/target',
    steps: [
      {
        action: 'assertText',
        label: 'Confirm the console heading',
        contains: 'Team Access Console',
        locator: {
          css: '#console-heading',
          text: 'Team Access Console',
          role: 'heading',
          testId: 'console-heading',
          tag: 'h1',
        },
      },
      {
        action: 'fill',
        label: 'Search the member directory',
        value: 'engineering',
        locator: {
          css: '#member-search',
          role: 'textbox',
          name: 'Search members',
          testId: 'member-search',
          tag: 'input',
        },
      },
      {
        action: 'extract',
        label: 'Read the member count',
        as: 'memberCount',
        locator: {
          css: '#member-count',
          text: '12 members',
          testId: 'member-count',
          tag: 'span',
        },
      },
      {
        action: 'click',
        label: 'Export the member list',
        locator: {
          css: '#export-csv-btn',
          text: 'Export CSV',
          role: 'button',
          testId: 'export-csv-btn',
          tag: 'button',
        },
      },
    ],
  },
  {
    id: 'invite-teammate',
    name: 'Access Console · invite a teammate',
    description:
      'Opens the invite panel, confirms it appeared, fills in an email address, and sends the invitation — a four-step interactive flow over elements that the resolver must keep finding as the markup shifts.',
    startUrl: '/target',
    steps: [
      {
        action: 'click',
        label: 'Open the invite panel',
        locator: {
          css: '#invite-member-btn',
          text: 'Invite member',
          role: 'button',
          testId: 'invite-member-btn',
          tag: 'button',
        },
      },
      {
        action: 'assertText',
        label: 'Confirm the invite panel opened',
        contains: 'Invite a teammate',
        locator: {
          css: '#invite-panel-heading',
          text: 'Invite a teammate',
          role: 'heading',
          testId: 'invite-panel-heading',
          tag: 'h2',
        },
      },
      {
        action: 'fill',
        label: 'Enter the invitee email',
        value: 'ada@example.com',
        locator: {
          css: '#invite-email',
          role: 'textbox',
          name: 'Email address',
          testId: 'invite-email',
          tag: 'input',
        },
      },
      {
        action: 'click',
        label: 'Send the invitation',
        locator: {
          css: '#invite-send-btn',
          text: 'Send invite',
          role: 'button',
          testId: 'invite-send-btn',
          tag: 'button',
        },
      },
    ],
  },
  {
    id: 'quotes-real-site',
    name: 'Quotes · resilient extraction on a real site',
    description:
      'Runs the same resilient locators against a real public website (quotes.toscrape.com) — a heading assertion plus two list extractions. Off the mock there is nothing mutating, so these steps simply resolve directly.',
    startUrl: 'https://quotes.toscrape.com/',
    steps: [
      {
        action: 'assertText',
        label: 'Confirm the site heading',
        contains: 'Quotes to Scrape',
        locator: {
          css: 'h1',
          text: 'Quotes to Scrape',
          role: 'heading',
          tag: 'h1',
        },
      },
      {
        action: 'extract',
        label: 'Extract every author',
        as: 'authors',
        multiple: true,
        locator: { css: '.quote .author' },
      },
      {
        action: 'extract',
        label: 'Extract every topic tag',
        as: 'tags',
        multiple: true,
        locator: { css: '.tag' },
      },
    ],
  },
];

/** The sample flows, ready to insert. */
export function sampleFlows(): Flow[] {
  const now = new Date().toISOString();
  return SEEDS.map((s) => ({ ...s, createdAt: now, updatedAt: now }));
}
