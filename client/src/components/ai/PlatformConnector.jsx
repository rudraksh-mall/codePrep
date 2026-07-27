import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinkedPlatforms, linkPlatform, unlinkPlatform, syncPlatforms } from '../../api/platform.api';
import Card, { CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';
import { Zap, Trophy } from 'lucide-react';

const PLATFORMS = [
  { value: 'leetcode', label: 'LeetCode', icon: Zap },
  { value: 'codeforces', label: 'Codeforces', icon: Trophy },
];

export default function PlatformConnector() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [platform, setPlatform] = useState('leetcode');
  const [username, setUsername] = useState('');

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-platforms'],
    queryFn: getLinkedPlatforms,
  });

  const linkMutation = useMutation({
    mutationFn: () => linkPlatform(platform, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-platforms'] });
      setUsername('');
      showToast({ type: 'success', title: 'Platform linked' });
    },
    onError: () => showToast({ type: 'error', title: 'Failed to link platform' }),
  });

  const unlinkMutation = useMutation({
    mutationFn: (p) => unlinkPlatform(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-platforms'] });
      showToast({ type: 'success', title: 'Platform unlinked' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncPlatforms,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linked-platforms'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      const msgs = Array.isArray(data) ? data.map((r) => `${r.platform}: ${r.synced || 0} synced`).join(', ') : 'Sync complete';
      showToast({ type: 'success', title: msgs });
    },
    onError: () => showToast({ type: 'error', title: 'Sync failed' }),
  });

  const linkedPlatforms = linked.map((l) => l.platform);

  function StatsBadge({ label, count, color }) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${color}`}>
        {count}
        <span className="text-surface-400 dark:text-surface-500">{label}</span>
      </span>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Linked Platforms</h3>
        <p className="text-sm text-surface-500">Connect your coding profiles to auto-sync solved problems</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {linked.length > 0 && (
          <div className="space-y-3">
            {linked.map((l) => {
              const p = PLATFORMS.find((x) => x.value === l.platform);
              return (
                <div key={l.platform}>
                  <div className="flex items-center justify-between rounded-lg bg-surface-50 dark:bg-surface-800 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {p?.icon && <p.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium text-surface-900 dark:text-white">{p?.label}</span>
                      <span className="text-xs text-surface-500">@{l.username}</span>
                      {l.lastSyncedAt && (
                        <span className="text-xs text-surface-400">synced {new Date(l.lastSyncedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
                        Sync
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => unlinkMutation.mutate(l.platform)}>
                        Unlink
                      </Button>
                    </div>
                  </div>
                  {l.stats?.totalSolved > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 px-3">
                      <span className="text-xs font-semibold text-surface-900 dark:text-white">{l.stats.totalSolved}</span>
                      <span className="text-2xs text-surface-500">solved</span>
                      <StatsBadge label="Easy" count={l.stats.easySolved} color="text-green-600 dark:text-green-400" />
                      <StatsBadge label="Med" count={l.stats.mediumSolved} color="text-amber-600 dark:text-amber-400" />
                      <StatsBadge label="Hard" count={l.stats.hardSolved} color="text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value} disabled={linkedPlatforms.includes(p.value)}>
                {p.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            containerClassName="flex-1"
          />
          <Button
            onClick={() => linkMutation.mutate()}
            loading={linkMutation.isPending}
            disabled={!username.trim()}
          >
            Link
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
