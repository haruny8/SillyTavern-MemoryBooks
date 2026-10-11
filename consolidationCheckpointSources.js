export function getConsolidationCheckpointSources(lorebook, candidate, chatSourceMode = false) {
    if (chatSourceMode) return [];
    const entries = Object.values(lorebook?.entries || {});
    return (candidate.memberIds || []).map(id => {
        const entry = entries.find(item => String(item.uid) === String(id));
        if (!entry) throw new Error('A consolidation source is missing. Review the Memory Book.');
        return { uid: String(id), entry };
    });
}