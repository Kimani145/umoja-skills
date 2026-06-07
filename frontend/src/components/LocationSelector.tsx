import { useState, useEffect } from 'react';
import { UMOJA_LOCATIONS, UmojaSector, UmojaZone, buildAddress } from '../data/umojaLocations';
import styles from './LocationSelector.module.css';

interface Props {
  value: string;
  onChange: (address: string) => void;
  labelPrefix?: string;
}

export default function LocationSelector({ value, onChange, labelPrefix = '' }: Props) {
  const [sector, setSector] = useState('');
  const [zone, setZone]     = useState('');
  const [court, setCourt]   = useState('');
  const [house, setHouse]   = useState('');

  // Parse existing value back into parts on mount
  useEffect(() => {
    if (value && !sector) {
      const parts = value.split(', ');
      if (parts.length >= 1) setSector(parts[0] || '');
      if (parts.length >= 2) setZone(parts[1] || '');
      if (parts.length >= 3) setCourt(parts[2] || '');
      if (parts.length >= 4) setHouse(parts.slice(3).join(', ') || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Propagate changes upward
  useEffect(() => {
    onChange(buildAddress(sector, zone, court, house));
  }, [sector, zone, court, house, onChange]);

  const sectorData = UMOJA_LOCATIONS.find((s: UmojaSector) => s.name === sector);
  const zoneData   = sectorData?.zones.find((z: UmojaZone) => z.name === zone);

  const handleSectorChange = (v: string) => {
    setSector(v);
    setZone('');
    setCourt('');
  };
  const handleZoneChange = (v: string) => {
    setZone(v);
    setCourt('');
  };

  return (
    <div className={styles.wrapper}>
      {labelPrefix && <span className={styles.groupLabel}>{labelPrefix}</span>}

      <div className={styles.row}>
        {/* Dropdown 1: Sector */}
        <label className={styles.label}>
          <span>Area / Sector</span>
          <select
            className={styles.select}
            value={sector}
            onChange={e => handleSectorChange(e.target.value)}
          >
            <option value="">Select area…</option>
            {UMOJA_LOCATIONS.map((s: UmojaSector) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>

        {/* Dropdown 2: Zone (conditional) */}
        <label className={styles.label}>
          <span>Zone</span>
          <select
            className={styles.select}
            value={zone}
            onChange={e => handleZoneChange(e.target.value)}
            disabled={!sector}
          >
            <option value="">Select zone…</option>
            {sectorData?.zones.map((z: UmojaZone) => (
              <option key={z.name} value={z.name}>{z.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row}>
        {/* Dropdown 3: Court/Block (conditional) */}
        <label className={styles.label}>
          <span>Court / Block</span>
          <select
            className={styles.select}
            value={court}
            onChange={e => setCourt(e.target.value)}
            disabled={!zone}
          >
            <option value="">Select court…</option>
            {zoneData?.courts.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {/* Free text: house/plot number */}
        <label className={styles.label}>
          <span>House / Plot No.</span>
          <input
            className={styles.input}
            value={house}
            onChange={e => setHouse(e.target.value)}
            placeholder="e.g. Hse 12 or Room 3B"
            disabled={!court}
          />
        </label>
      </div>

      {/* Preview */}
      {sector && (
        <p className={styles.preview}>
          📍 {buildAddress(sector, zone, court, house) || sector}
        </p>
      )}
    </div>
  );
}
