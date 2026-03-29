export default function ProjectDetailPage({
  params: _params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <div className="space-y-north-lg">
      <h1 className="text-page-title">Project Detail</h1>
      <p className="text-foreground-secondary">View linked notes, tasks, and decisions.</p>
    </div>
  );
}
