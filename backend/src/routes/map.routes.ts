import { Router } from 'express';
import {
  getAllMaps,
  getMapById,
  getDefaultMap,
  createMap,
  updateMap,
  deleteMap,
  togglePublish,
  setDefaultSpawn,
} from '../controllers/map.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireDeveloper } from '../middleware/developer.middleware';

const router = Router();

// Public routes (or auth-aware but not requiring auth)
// These routes work without authentication but may return different results based on auth status
router.get('/', getAllMaps); // Returns published maps for non-developers, all for developers
router.get('/default', getDefaultMap); // Get the default spawn map
router.get('/:id', getMapById); // Get specific map (checks permissions internally)

// Developer-only routes
router.post('/', authenticate, requireDeveloper, createMap);
router.put('/:id', authenticate, requireDeveloper, updateMap);
router.delete('/:id', authenticate, requireDeveloper, deleteMap);
router.patch('/:id/publish', authenticate, requireDeveloper, togglePublish);
router.patch('/:id/set-default', authenticate, requireDeveloper, setDefaultSpawn);

export default router;
