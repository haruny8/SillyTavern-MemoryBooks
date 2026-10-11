import assert from 'node:assert/strict';
import test from 'node:test';
import { getConsolidationCheckpointSources } from './consolidationCheckpointSources.js';

test('chat-source checkpoints do not resolve synthetic IDs against the destination Memory Book', () => {
    const lorebook = { entries: { one: { uid: 'memory-1', content: 'existing' } } };
    const candidate = { memberIds: ['chat:12:source-hash'] };

    assert.deepEqual(getConsolidationCheckpointSources(lorebook, candidate, true), []);
    assert.throws(
        () => getConsolidationCheckpointSources(lorebook, candidate, false),
        /consolidation source is missing/i,
    );
});