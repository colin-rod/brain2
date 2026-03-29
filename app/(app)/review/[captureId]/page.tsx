export default function ReviewPage({
  params: _params,
}: {
  params: Promise<{ captureId: string }>;
}) {
  return (
    <div className="space-y-north-lg">
      <h1 className="text-page-title">Review</h1>
      <p className="text-foreground-secondary">Review and edit extracted content before saving.</p>
    </div>
  );
}
