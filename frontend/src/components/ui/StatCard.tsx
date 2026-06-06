import { LucideIcon } from 'lucide-react';
import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatCard({ label, value, sublabel, icon: Icon, iconColor = '#1A56DB', iconBg = '#EBF0FF' }: Props) {
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.body}>
        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
          {sublabel && <p className={styles.sublabel}>{sublabel}</p>}
        </div>
        <div className={styles.icon} style={{ background: iconBg, color: iconColor }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
