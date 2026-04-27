'use server';

import { createClient } from '@/lib/supabase/server';
import { storePersonEmbedding, storeProjectEmbedding } from './embeddings';
import { buildEntityEmbeddingText } from '@/lib/embeddings/build-entity-text';
import { generateWikiSummary } from './generate-wiki-summary';

export interface EntityBackfillResult {
  peopleEmbedded: number;
  projectsEmbedded: number;
  summariesGenerated: number;
  errors: number;
}

/**
 * One-time backfill for person/project embeddings.
 *
 * For each entity:
 *   - If `compiled_summary` is missing, call `generateWikiSummary()`
 *     (which now also writes the embedding as a side-effect).
 *   - If a summary exists but `embedding IS NULL`, embed directly
 *     from `name + role|status + compiled_summary`.
 *
 * Idempotent — safe to re-run.
 */
export async function backfillEntityEmbeddings(): Promise<EntityBackfillResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { peopleEmbedded: 0, projectsEmbedded: 0, summariesGenerated: 0, errors: 0 };
  }

  let peopleEmbedded = 0;
  let projectsEmbedded = 0;
  let summariesGenerated = 0;
  let errors = 0;

  // ── People ─────────────────────────────────────────────────────────
  const { data: people } = await supabase
    .from('people')
    .select('id, name, role, compiled_summary, embedding')
    .eq('user_id', user.id);

  for (const p of people ?? []) {
    const row = p as {
      id: string;
      name: string;
      role: string | null;
      compiled_summary: string | null;
      embedding: unknown;
    };
    try {
      if (!row.compiled_summary) {
        const result = await generateWikiSummary('person', row.id);
        if (result.summary && !result.error) {
          summariesGenerated++;
          // generateWikiSummary already wrote the embedding when it generated a fresh summary.
          peopleEmbedded++;
        } else {
          errors++;
        }
      } else if (!row.embedding) {
        const text = buildEntityEmbeddingText({
          name: row.name,
          roleOrStatus: row.role,
          summary: row.compiled_summary,
        });
        if (text.trim()) {
          await storePersonEmbedding(row.id, text);
          peopleEmbedded++;
        }
      }
    } catch {
      errors++;
    }
  }

  // ── Projects ───────────────────────────────────────────────────────
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, compiled_summary, embedding')
    .eq('user_id', user.id);

  for (const pr of projects ?? []) {
    const row = pr as {
      id: string;
      name: string;
      status: string | null;
      compiled_summary: string | null;
      embedding: unknown;
    };
    try {
      if (!row.compiled_summary) {
        const result = await generateWikiSummary('project', row.id);
        if (result.summary && !result.error) {
          summariesGenerated++;
          projectsEmbedded++;
        } else {
          errors++;
        }
      } else if (!row.embedding) {
        const text = buildEntityEmbeddingText({
          name: row.name,
          roleOrStatus: row.status,
          summary: row.compiled_summary,
        });
        if (text.trim()) {
          await storeProjectEmbedding(row.id, text);
          projectsEmbedded++;
        }
      }
    } catch {
      errors++;
    }
  }

  return { peopleEmbedded, projectsEmbedded, summariesGenerated, errors };
}
