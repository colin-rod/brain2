export default function PersonDetailPage({
  params: _params,
}: {
  params: Promise<{ personId: string }>;
}) {
  return (
    <div className="space-y-north-lg">
      <h1 className="text-page-title">Person Detail</h1>
      <p className="text-foreground-secondary">View linked notes and tasks for this person.</p>
    </div>
  );
}
