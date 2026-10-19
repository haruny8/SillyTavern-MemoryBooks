// Copyright (C) 2024–2026 Aiko Hanasaki
// SPDX-License-Identifier: AGPL-3.0-only

import assert from 'node:assert/strict';
import test from 'node:test';
import { readArcPromptDocument } from './arcPromptPersistencePolicy.js';

const validate = data => data && data.overrides && typeof data.overrides === 'object';

test('only a 404 is treated as a missing prompt file', async () => {
  const result = await readArcPromptDocument(new Response('', { status: 404 }), validate);
  assert.deepEqual(result, { missing: true });
});

test('non-404 HTTP failures do not trigger prompt-file initialization', async () => {
  for (const status of [403, 500]) {
    await assert.rejects(
      readArcPromptDocument(new Response('', { status }), validate),
      new RegExp(`Failed to load consolidation prompts: ${status}`),
    );
  }
});

test('valid prompt documents are returned unchanged', async () => {
  const data = { version: 1, overrides: { custom: { prompt: 'Keep this prompt' } } };
  const result = await readArcPromptDocument(new Response(JSON.stringify(data)), validate);
  assert.deepEqual(result, { missing: false, data });
});

test('decodes base64 JSON stored by the SillyTavern upload endpoint', async () => {
  const data = { version: 1, overrides: { custom: { prompt: 'Keep this prompt: caf\u00e9' } } };
  const encoded = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
  const result = await readArcPromptDocument(new Response(encoded), validate);
  assert.deepEqual(result, { missing: false, data });
});

test('invalid JSON and invalid documents are rejected without becoming missing files', async () => {
  await assert.rejects(
    readArcPromptDocument(new Response('{'), validate),
    /invalid JSON; it was left unchanged/,
  );
  await assert.rejects(
    readArcPromptDocument(new Response('{"version":1,"overrides":null}'), validate),
    /invalid structure; it was left unchanged/,
  );
});