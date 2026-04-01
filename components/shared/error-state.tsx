import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="space-y-3 border-[var(--color-danger)]/30">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Card>
  );
}
