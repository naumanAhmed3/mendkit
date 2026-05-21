import { mutation } from '@/lib/mutation';
import { Console } from './console';

export const dynamic = 'force-dynamic';

// The bundled automation target — a mock "Team Access Console" whose
// markup is mutated by ?v=N so MendKit's self-healing can be exercised
// on demand. This is the page the sample flows drive.
export default async function TargetPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const version = Number(v) || 0;
  return <Console attrs={mutation(version)} version={version} />;
}
