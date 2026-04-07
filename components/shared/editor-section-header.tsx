import { Button } from '@/components/ui/button';
import { Plus, type LucideIcon } from 'lucide-react';

interface EditorSectionHeaderProps {
  title: string;
  onAdd: () => void;
  icon?: LucideIcon;
  count?: number;
}

export function EditorSectionHeader({ title, onAdd, icon: Icon, count }: EditorSectionHeaderProps) {
  const hasIconAndCount = Icon !== undefined && count !== undefined;

  return (
    <div className={`flex items-center justify-between${hasIconAndCount ? ' mb-north-md' : ''}`}>
      {hasIconAndCount ? (
        <h2 className="text-section-header flex items-center gap-north-sm">
          <Icon className="h-4 w-4" />
          {title} ({count})
        </h2>
      ) : (
        <h3 className="text-section-header">{title}</h3>
      )}
      <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add
      </Button>
    </div>
  );
}
