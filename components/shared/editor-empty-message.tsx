interface EditorEmptyMessageProps {
  message: string;
}

export function EditorEmptyMessage({ message }: EditorEmptyMessageProps) {
  return <p className="text-metadata text-foreground-muted py-north-sm">{message}</p>;
}
