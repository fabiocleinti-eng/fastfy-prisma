import { Router } from 'express';
import { cadastrarUsuario } from './usuariosController.js';

const router = Router();

router.post('/', cadastrarUsuario);

export default router;
