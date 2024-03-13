import express from "express";
import cors from 'cors';
import morgan from 'morgan'; // Import Morgan
import "./db/conn.js";
import router from "./router/routes.js";

const app = express();
const PORT = 8000;

// Use Morgan logger
app.use(morgan('dev'));

app.use(cors());
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
