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

type createConta = {
  agencia: number;
  numero: number;
  nome: string;
  cpf: string;
  data_nascimento: string;
};

// POST /
contaCorrenteRoutes.post(
  "/",
  (req: Request<{}, {}, createConta>, res: Response) => {
    const { agencia, numero, nome, cpf, data_nascimento } = req.body;
    const contaEncontrada = contas.find(
      (c) => c.cpf === cpf || (c.agencia === agencia && c.numero === numero)
    );

    if (contaEncontrada) {
      res.status(400).send({
        error: "Não é possível criar uma nova conta.",
      });
      return;
    }

    try {
      let dataNascimento = new Date(data_nascimento);
      const novaConta = new ContaCorrente(
        agencia,
        numero,
        nome,
        cpf,
        dataNascimento,
        new Date()
      );
      contas.push(novaConta);
      const response = buildContaResponse(novaConta);
      console.log("Nova Conta", response);
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error });
      return;
    }
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

    res.status(200).send(buildContaResponse(conta));
  }
);

// GET /:agencia/:numero -> Retorna os dados da conta
contaCorrenteRoutes.get(
  "/:agencia/:numero",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const agencia = parseInt(req.params.agencia ?? "", 10);
    const numeroConta = parseInt(req.params.numero ?? "", 10);
    // buscar uma conta com a mesma agencia e numero
    // const conta = contas.find((c) => {
    //   if ((c.agencia === agencia) && (c.numero === numeroConta)) {
    //     return c;
    //   }
    // })

    const conta = contas.find(
      (c) => c.agencia === agencia && c.numero === numeroConta
    );
    // senão encontrar, retorna status 404 com mensagem de erro, conta não encontrada
    if (!conta) {
      res.status(404).send({ error: "Conta Inválida" });
      return;
    }
    // se encontrar, retorna status 200 e os dados da conta
    res.status(200).send(buildContaResponse(conta));
  }
);

// GET /:agencia/:numero/saldo -> Retorna somente o saldo da conta
contaCorrenteRoutes.get(
  "/:agencia/:numero/saldo",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const agencia = parseInt(req.params.agencia ?? "", 10);
    const numeroConta = parseInt(req.params.numero ?? "", 10);

    const conta = contas.find(
      (c) => c.agencia === agencia && c.numero === numeroConta
    );
    // senão encontrar, retorna status 404 com mensagem de erro, conta não encontrada
    if (!conta) {
      res.status(404).send({ error: "Conta Inválida" });
      return;
    }
    // se encontrar, retorna status 200 e os dados da conta
    res.status(200).send({ saldo: conta.saldo });
  }
);

// PATCH /deposito
contaCorrenteRoutes.patch(
  "/deposito",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const userId = req.headers["user-id"];
    const { valor } = req.body;

    const contaIndex = contas.findIndex((c) => c.id === userId);

    // senão encontrar, retorna status 404 com mensagem de erro, conta não encontrada
    if (contaIndex < 0) {
      res.status(404).send({ error: "Conta Inválida" });
      return;
    }

    // se encontrar, atualiza o saldo e retorna status 200 e o saldo atualizado
    contas[contaIndex].setSaldo(valor, "C");
    res.status(200).send({
      id: contas[contaIndex].id,
      saldo: contas[contaIndex].saldo,
    });
  }
);

// PATCH /deposito
contaCorrenteRoutes.patch(
  "/saque",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const userId = req.headers["user-id"];
    const { valor } = req.body;

    const contaIndex = contas.findIndex((c) => c.id === userId);

    // senão encontrar, retorna status 404 com mensagem de erro, conta não encontrada
    if (contaIndex < 0) {
      res.status(404).send({ error: "Conta Inválida" });
      return;
    }

    // se encontrar, atualiza o saldo e retorna status 200 e o saldo atualizado
    contas[contaIndex].setSaldo(valor, "D");
    res.status(200).send({
      id: contas[contaIndex].id,
      saldo: contas[contaIndex].saldo,
    });
  }
);

// DELETE /
contaCorrenteRoutes.delete(
  "/",
  authenticatedMiddleware,
  (req: Request, res: Response) => {
    const userId = req.headers["user-id"];
    const contaIndex = contas.findIndex((c) => c.id === userId);
    // senão encontrar, retorna status 404 com mensagem de erro, conta não encontrada
    if (contaIndex < 0) {
      res.status(404).send({ error: "Conta Inválida" });
      return;
    }

    if (contas[contaIndex].saldo > 0) {
      res
        .status(403)
        .send({ error: "Está conta possuí saldo e não pode ser encerrada." });
      return;
    }
    contas.splice(contaIndex, 1);
    res.status(204).send();
  }
);

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
  req.headers["user-id"] = payload.id;
  next();
}

function buildContaResponse(conta: ContaCorrente) {
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

  return {
    id: idConta,
    agencia,
    numero,
    nome_cliente: nomeCliente,
    cpf,
    data_nascimento: dataNascimento,
    data_criacao: dataCriacao,
    saldo,
  };
}

export { contaCorrenteRoutes };
