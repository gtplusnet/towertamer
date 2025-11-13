import { GameMap } from './components/GameMap/GameMap';
import { Character } from './components/Character/Character';
import { TouchController } from './components/TouchController/TouchController';
import { useCharacterMovement } from './hooks/useCharacterMovement';
import styles from './App.module.css';

function App() {
  const { character, move } = useCharacterMovement({
    initialX: 150,
    initialY: 250,
    moveSpeed: 48,
    bounds: {
      minX: 0,
      maxX: window.innerWidth - 48, // 48px is character width (16px * 3 scale)
      minY: 0,
      maxY: window.innerHeight - 48, // 48px is character height
    },
  });

  return (
    <div className={styles.app}>
      <TouchController onSwipe={move}>
        <GameMap>
          <Character
            position={character.position}
            direction={character.direction}
            animationFrame={character.animationFrame}
            isMoving={character.isMoving}
          />
        </GameMap>
      </TouchController>
    </div>
  );
}

export default App;
