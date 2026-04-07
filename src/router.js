import { Router } from 'express';
import contatosRouter from './contatos/contatosRouter.js';
import usuariosRouter from './usuarios/usuariosRouter.js';
import authRouter from './auth/authRouter.js';

const router = Router();

router.use('/contatos', contatosRouter);
router.use('/usuarios', usuariosRouter);
router.use('/auth', authRouter);

export default router;
