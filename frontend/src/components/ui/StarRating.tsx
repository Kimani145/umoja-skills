import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 14 }: Props) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? '#F59E0B' : 'none'}
          stroke={n <= value ? '#F59E0B' : '#D1D5DB'}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
          onClick={() => onChange?.(n)}
        />
      ))}
    </span>
  );
}
