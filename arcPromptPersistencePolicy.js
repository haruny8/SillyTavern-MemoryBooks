// Copyright (C) 2024–2026 Aiko Hanasaki
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Read a prompt document without treating read failures as a missing file.
 * @param {Response} response
 * @param {(data: Object) => boolean} validate
 * @returns {Promise<{missing: true, data?: undefined} | {missing: false, data: Object}>}
 */
export async function readArcPromptDocument(response, validate) {
  if (response.status === 404) {
    return { missing: true };
  }
  if (!response.ok) {
    throw new Error(`Failed to load consolidation prompts: ${response.status} ${response.statusText}`);
  }

  const text = (await response.text()).trim();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    try {
      const binary = atob(text);
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      data = JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      throw new Error(`Consolidation prompts file contains invalid JSON; it was left unchanged. ${error.message}`);
    }
  }

  if (!validate(data)) {
    throw new Error('Consolidation prompts file has an invalid structure; it was left unchanged.');
  }

  return { missing: false, data };
}

export function getArcPromptLoadErrorMessage(error) {
  return error instanceof TypeError && /fetch/i.test(error.message)
    ? 'Could not reach the server while loading consolidation prompts; the existing file was left unchanged.'
    : error.message;
}