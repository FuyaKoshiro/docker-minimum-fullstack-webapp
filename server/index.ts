import express, { Request, Response } from "express";
import cors from "cors";
import { Client } from "pg";

const app = express();
app.use(cors());
const port = process.env.PORT || 8080;

const client = new Client({
  host: process.env.DB_HOST || "db", // 'db' is the service name in docker-compose
  user: process.env.POSTGRES_USER || "user",
  password: process.env.POSTGRES_PASSWORD || "password",
  database: process.env.POSTGRES_DB || "db",
  port: 5432,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express with TypeScript!");
});

app.get("/db", (req, res) => {
  client.query("SELECT NOW()", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error querying the database");
    } else {
      // Return the current time
      res.send(result.rows);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
