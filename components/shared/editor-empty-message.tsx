interface EditorEmptyMessageProps {
  message: string;
}

export function EditorEmptyMessage({ message }: EditorEmptyMessageProps) {
  return (
    <p role="status" className="text-metadata text-foreground-muted py-north-sm italic">
      {message}
    </p>
  );
}
