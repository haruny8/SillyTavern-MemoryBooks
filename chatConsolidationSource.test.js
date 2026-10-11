// Copyright (C) 2024–2026 Aiko Hanasaki
// SPDX-License-Identifier: AGPL-3.0-only

import assert from 'node:assert/strict';
import test from 'node:test';
import { captureChatSelection } from './chatSelection.js';
import {
    buildChatConsolidationEntries,
    chatIndicesToRanges,
    getChatSourceIndices,
    verifyChatConsolidationEntries,
} from './chatConsolidationSource.js';

test('converts a validated chat selection into analysis entries', () => {
    const messages = [
        { name: 'User', mes: 'first' },
        { name: 'Inline Summary', mes: 'second summary' },
    ];
    const selection = captureChatSelection(messages, 'chat', [1]);
    const entries = buildChatConsolidationEntries(messages, selection, 'chat');

    assert.equal(entries.length, 1);
    assert.equal(entries[0].comment, '[001] - Inline Summary');
    assert.equal(entries[0].content, 'second summary');
    assert.deepEqual(getChatSourceIndices(entries, [entries[0].uid]), [1]);
});

test('rejects stale chat selections before analysis can start', () => {
    const messages = [{ name: 'Bot', mes: 'original' }];
    const selection = captureChatSelection(messages, 'chat', [0]);
    messages[0].mes = 'changed';

    assert.throws(
        () => buildChatConsolidationEntries(messages, selection, 'chat'),
        /selected chat messages changed/i,
    );
});

test('plans noncontiguous source ranges and detects changes before commit', () => {
    const messages = [
        { mes: 'one' },
        { mes: 'two' },
        { mes: 'three' },
        { mes: 'four' },
    ];
    const selection = captureChatSelection(messages, 'chat', [0, 1, 3]);
    const entries = buildChatConsolidationEntries(messages, selection, 'chat');

    assert.deepEqual(chatIndicesToRanges([3, 1, 0, 1]), [
        { start: 0, end: 1 },
        { start: 3, end: 3 },
    ]);
    verifyChatConsolidationEntries(messages, entries);
    messages[3].mes = 'changed';
    assert.throws(() => verifyChatConsolidationEntries(messages, entries), /changed before commit/i);
});