import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const maria = { nome: 'Maria Souza', email: 'Maria@Email.com', senha: 'senha1234', perfil: 'CONSUMIDOR' };

describe('POST /api/auth/register', () => {
  it('cria a conta e devolve token e usuário', async () => {
    const res = await api().post('/api/auth/register').send(maria);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({ id: 1, nome: 'Maria Souza', email: 'maria@email.com', telefone: null, perfil: 'CONSUMIDOR' });
  });

  it('guarda o telefone opcional e valida o formato', async () => {
    const ok = await api().post('/api/auth/register').send({ ...maria, telefone: '(14) 99999-0000' });
    expect(ok.body.usuario.telefone).toBe('(14) 99999-0000');

    const bad = await api().post('/api/auth/register').send({ ...maria, email: 'outra@email.com', telefone: 'abc' });
    expect(bad.status).toBe(400);
    expect(bad.body.erro.detalhes).toHaveProperty('telefone');
  });

  it('não permite escolher ADMINISTRADOR ou ATENDENTE', async () => {
    for (const perfil of ['ADMINISTRADOR', 'ATENDENTE']) {
      const res = await api().post('/api/auth/register').send({ ...maria, perfil });
      expect(res.status).toBe(400);
      expect(res.body.erro.detalhes).toHaveProperty('perfil');
    }
  });

  it('recusa e-mail repetido', async () => {
    await api().post('/api/auth/register').send(maria);
    const res = await api().post('/api/auth/register').send({ ...maria, email: 'maria@email.com' });

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('EMAIL_EM_USO');
  });

  it('valida os campos e lista os erros', async () => {
    const res = await api().post('/api/auth/register').send({ nome: 'A', email: 'x', senha: '123' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.erro.detalhes)).toEqual(expect.arrayContaining(['nome', 'email', 'senha', 'perfil']));
  });
});

describe('POST /api/auth/login', () => {
  it('entra com e-mail e senha corretos', async () => {
    await api().post('/api/auth/register').send(maria);
    const res = await api().post('/api/auth/login').send({ email: 'maria@email.com', senha: 'senha1234' });

    expect(res.status).toBe(200);
    expect(res.body.usuario.perfil).toBe('CONSUMIDOR');
  });

  it('usa a mesma mensagem para senha errada e e-mail inexistente', async () => {
    await api().post('/api/auth/register').send(maria);
    const wrongPassword = await api().post('/api/auth/login').send({ email: 'maria@email.com', senha: 'errada123' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'ninguem@email.com', senha: 'senha1234' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('bloqueia usuário desativado', async () => {
    const { user } = await createUser('CONSUMIDOR', 'inativo@teste.local');
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });

    const res = await api().post('/api/auth/login').send({ email: 'inativo@teste.local', senha: 'senha-de-teste' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('devolve o usuário do token', async () => {
    const { auth } = await createUser('PRODUTOR', 'produtor@teste.local');
    const res = await api().get('/api/auth/me').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'produtor@teste.local', perfil: 'PRODUTOR' });
  });

  it('exige token válido', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set({ Authorization: 'Bearer invalido' })).status).toBe(401);
  });
});

describe('recuperação de senha', () => {
  it('troca a senha com o token e não deixa reutilizar', async () => {
    await api().post('/api/auth/register').send(maria);

    const forgot = await api().post('/api/auth/forgot-password').send({ email: 'maria@email.com' });
    const token = forgot.body.tokenRecuperacao;
    expect(token).toEqual(expect.any(String));

    const reset = await api().post('/api/auth/reset-password').send({ token, novaSenha: 'novasenha99' });
    expect(reset.status).toBe(200);

    const login = await api().post('/api/auth/login').send({ email: 'maria@email.com', senha: 'novasenha99' });
    expect(login.status).toBe(200);

    const again = await api().post('/api/auth/reset-password').send({ token, novaSenha: 'outrasenha9' });
    expect(again.status).toBe(400);
  });

  it('responde igual para e-mail não cadastrado', async () => {
    const res = await api().post('/api/auth/forgot-password').send({ email: 'ninguem@email.com' });

    expect(res.status).toBe(200);
    expect(res.body.tokenRecuperacao).toBeUndefined();
  });
});
