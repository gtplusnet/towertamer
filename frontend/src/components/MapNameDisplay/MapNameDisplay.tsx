import styles from './MapNameDisplay.module.css';

interface MapNameDisplayProps {
  mapName: string;
}

export const MapNameDisplay = ({ mapName }: MapNameDisplayProps) => {
  return (
    <div className={styles.mapNameContainer}>
      <span className={styles.mapName}>{mapName}</span>
    </div>
  );
};
