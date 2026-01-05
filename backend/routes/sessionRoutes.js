import express from 'express';
import { authenticate } from '../middlewares/auth.js';

import {
    getAllPublishedSessions,
    getMySessions,
    createSession,
    updateSession,
    deleteSession,
    likeSession,
    getSessionById
} from '../controllers/sessionsController.js';

const router = express.Router();

// GET all published sessions
router.get('/get-all-sessions',authenticate, getAllPublishedSessions);


router.get('/get-session/:id',authenticate, getSessionById);

// GET logged-in user's sessions
router.get('/my-sessions',authenticate, getMySessions);

// POST create new session
router.post('/create',authenticate, createSession);

router.post('/like/:id',authenticate, likeSession);

// PATCH update a session
router.patch('/update/:id',authenticate, updateSession);

// DELETE a session
router.delete('/delete/:id',authenticate, deleteSession);

export default router;