import express, { Express, Response } from "express";

class App {
  private readonly PORT = 3000;
  private _app: Express;

  constructor() {
    this._app = express();
  }

  public configure() {
    // Configura o app para receber e enviar com JSON
    this._app.use(express.json());

    // Rotas
    this._app.get("/health", (_, res: Response) => {
      res.send({ status: "OK" });
    });
  }

  public start() {
    this._app.listen(this.PORT, (error) => {
      if (error) {
        console.log(error);
      }
      console.log(`Servidor iniciado na porta ${this.PORT}`);
    });
  }
}

export const app = new App();
