import { Bookmark, BookMarked } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import styles from './SaveButton.module.css';

interface Props {
  serviceId: string;
  size?: number;
  showLabel?: boolean;
}

export default function SaveButton({ serviceId, size = 16, showLabel = false }: Props) {
  const qc = useQueryClient();

  const { data: savedList } = useQuery({
    queryKey: ['savedProviders'],
    queryFn: () => api.get('/saved/').then(r => r.data as { id: string }[]),
    staleTime: 30_000,
  });

  const isSaved = (savedList || []).some((s: any) => s.id === serviceId);

  const toggle = useMutation({
    mutationFn: () =>
      isSaved
        ? api.delete('/saved/', { data: { service_id: serviceId } })
        : api.post('/saved/', { service_id: serviceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savedProviders'] }),
  });

  return (
    <button
      className={`${styles.btn} ${isSaved ? styles.saved : ''}`}
      onClick={(e) => { e.stopPropagation(); toggle.mutate(); }}
      title={isSaved ? 'Remove from saved' : 'Save provider'}
      disabled={toggle.isPending}
    >
      {isSaved ? <BookMarked size={size} /> : <Bookmark size={size} />}
      {showLabel && <span>{isSaved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
