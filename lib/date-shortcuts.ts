function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type DateShortcut = { label: string; value: string };

export function getDateShortcuts(): DateShortcut[] {
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    { label: 'Today', value: formatDateValue(now) },
    { label: 'Tomorrow', value: formatDateValue(tomorrow) },
    { label: 'Next week', value: formatDateValue(nextWeek) },
    { label: 'Next month', value: formatDateValue(nextMonth) },
  ];
}
