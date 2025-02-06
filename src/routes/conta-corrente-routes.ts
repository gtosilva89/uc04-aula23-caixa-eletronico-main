import express, { Request, Response } from "express";
import ContaCorrente from "../classes/conta-corrente";

const router = express.Router();

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

console.log(contas[0]);

// GET /:id -> Retornar a conta corrente pelo id
router.get("/:id", (req: Request, res: Response) => {
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
  res.send(conta);
});

// GET /:agencia/:numero

// GET /:agencia/:numero/saldo

// POST /

// PATCH /saldo

// DELETE /
