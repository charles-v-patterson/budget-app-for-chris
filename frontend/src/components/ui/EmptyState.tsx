interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}
