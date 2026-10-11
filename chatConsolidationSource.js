// Copyright (C) 2024–2026 Aiko Hanasaki
// SPDX-License-Identifier: AGPL-3.0-only

import { fingerprintChatMessage, validateChatSelection } from './chatSelection.js';

export function buildChatConsolidationEntries(messages, selection, chatKey) {
    if (!validateChatSelection(selection, messages, chatKey)) {
        throw new Error('The selected chat messages changed. Refresh the selection and try again.');
    }

    return selection.messages.map(({ index, hash }) => {
        const message = messages[index];
        const name = String(message?.name || '').trim();
        const label = name || 'Message';
        return {
            uid: `chat:${index}:${hash}`,
            comment: `[${String(index).padStart(3, '0')}] - ${label}`,
            content: String(message?.mes || '').trim(),
            sourceChatIndex: index,
            sourceChatHash: hash || fingerprintChatMessage(message),
        };
    }).filter(entry => entry.content);
}

export function verifyChatConsolidationEntries(messages, entries) {
    for (const entry of entries || []) {
        const index = entry?.sourceChatIndex;
        if (!Number.isInteger(index) || !messages?.[index]
            || fingerprintChatMessage(messages[index]) !== entry.sourceChatHash) {
            throw new Error('A selected chat message changed before commit. Refresh the selection and try again.');
        }
    }
}

export function getChatSourceIndices(entries, memberIds) {
    const wanted = new Set((memberIds || []).map(String));
    return (entries || [])
        .filter(entry => wanted.has(String(entry?.uid)))
        .map(entry => entry.sourceChatIndex)
        .filter(index => Number.isInteger(index) && index >= 0);
}

export function chatIndicesToRanges(indices) {
    const sorted = [...new Set((indices || [])
        .filter(index => Number.isInteger(index) && index >= 0))]
        .sort((a, b) => a - b);
    const ranges = [];
    for (const index of sorted) {
        const previous = ranges[ranges.length - 1];
        if (previous && index === previous.end + 1) previous.end = index;
        else ranges.push({ start: index, end: index });
    }
    return ranges;
}