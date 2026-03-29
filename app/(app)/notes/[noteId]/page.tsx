export default function NoteDetailPage({
  params: _params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  return (
    <div className="space-y-north-lg">
      <h1 className="text-page-title">Note Detail</h1>
      <p className="text-foreground-secondary">View note with all linked entities.</p>
    </div>
  );
}
