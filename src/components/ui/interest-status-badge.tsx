import { Badge } from '@/components/ui/badge';
import {
  interestCycleStatusLabel,
  interestCycleStatusVariant,
  type InterestCycleStatus,
} from '@/lib/labels';

export function InterestStatusBadge({
  status,
}: {
  status: InterestCycleStatus;
}) {
  return (
    <Badge variant={interestCycleStatusVariant[status]}>
      {interestCycleStatusLabel[status]}
    </Badge>
  );
}
