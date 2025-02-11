import express, { NextFunction, Request, Response } from "express";
import ContaCorrente from "../classes/conta-corrente";

const contaCorrenteRoutes = express.Router();

const contas: ContaCorrente[] = [
  new ContaCorrente(
    1234,
    1,
    "Cezar Augusto",
    "1234123421",
    new Date("1990-07-12"),
    new Date()
  ),
];

// GET /:id -> Retornar a conta corrente pelo id
contaCorrenteRoutes.get(
  "/:id",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send({ error: "Id da conta inválido" });
      return;
    }

    const conta = contas.find((c) => c.id === id);
    if (!conta) {
      res.status(404).send({ error: "Conta não encontrada" });
      return;
    }
    const {
      id: idConta,
      agencia,
      numero,
      nomeCliente,
      cpf,
      dataNascimento,
      dataCriacao,
      saldo,
    } = conta;

    res.send({
      id: idConta,
      agencia,
      numero,
      nome_cliente: nomeCliente,
      cpf,
      data_nascimento: dataNascimento,
      data_criacao: dataCriacao,
      saldo,
    });
  }
);

// authentication - criar a chave de acesso temporario
// autenticação - Você informa suas credenciais e o sistema valida quem você é
// POST /auth
contaCorrenteRoutes.post("/auth", (req: Request, res: Response) => {
  // recuperar do body o usuário e senha
  const { cpf, password } = req.body;

  // valida a existencia de um usuário com o CPF e senha informados
  const conta = contas.find((c) => c.cpf === cpf);

  // Se não encontrou a conta, retorna um erro 401 - Unauthorized (Não Autorizado)
  if (!conta || conta.senha !== password) {
    res.status(401).send({ error: "Não Autorizado" });
    return;
  }

  // gera um token (chave) de acesso temporario

  const expires_in_ms = 60000;
  const payload = {
    id: conta.id,
    expires_in: Date.now() + expires_in_ms,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64");

  // retorna o token caso o usuário seja validado

  res.status(201).send({ token });
});

// GET /:agencia/:numero

// GET /:agencia/:numero/saldo

// PATCH /saldo

// DELETE /

// middleware - usuario autenticado
function authenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // validar se veio a propriedade Authorization no header
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(403).send({ erro: "Não Autorizado" });
    return;
  }
  // extrair o objeto do token da sessão
  const [, token] = authorization.split(" ");

  const parsedToken = Buffer.from(token, "base64").toString("utf-8");

  const payload = JSON.parse(parsedToken);
  // validar se existe um usuário com o id da sessão
  const conta = contas.find((c) => c.id === payload.id);

  // validar se o tempo de sessão é menor que a hora atual
  if (!conta || payload.expires_in < Date.now()) {
    res.status(403).send({ error: "Não Autorizado" });
    return;
  }

  next();
}

export { contaCorrenteRoutes };
