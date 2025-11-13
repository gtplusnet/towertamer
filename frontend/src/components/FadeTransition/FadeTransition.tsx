import { useEffect, useState } from 'react';
import styles from './FadeTransition.module.css';

interface FadeTransitionProps {
  isTransitioning: boolean;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({ isTransitioning }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
    } else {
      // Keep visible for fade-out, then hide
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  if (!isVisible && !isTransitioning) return null;

  return (
    <div
      className={`${styles.fadeOverlay} ${isTransitioning ? styles.fadeIn : styles.fadeOut}`}
    />
  );
};
