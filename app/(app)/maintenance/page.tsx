import { Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { OrphanedNotesSection } from '@/components/maintenance/orphaned-notes-section';
import { UnassignedTasksSection } from '@/components/maintenance/unassigned-tasks-section';
import { BackfillEmbeddingsSection } from '@/components/maintenance/backfill-embeddings-section';
import { getOrphanedNotes, getUnassignedTasks } from '@/lib/actions/maintenance';

export default async function MaintenancePage() {
  const [orphanedNotes, unassignedTasks] = await Promise.all([
    getOrphanedNotes(),
    getUnassignedTasks(),
  ]);

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Maintenance" icon={Wrench} />

      <BackfillEmbeddingsSection />

      <OrphanedNotesSection notes={orphanedNotes} />

      <UnassignedTasksSection tasks={unassignedTasks} />
    </div>
  );
}
