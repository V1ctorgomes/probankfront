import { Suspense } from 'react';
import ReceiptsPage from './receipts-content';

export default function Page() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <ReceiptsPage />
    </Suspense>
  );
}
