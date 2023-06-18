import { config } from "dotenv";
config();

import express from "express";
import pool from "./database/connection.js";
import { verifyToken } from "./middlewares/verifyToken.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/usuarios", verifyToken, async (req, res) => {
  try {
    const text = "SELECT * FROM usuarios";
    const { rows } = await pool.query(text);
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.get("/usuarios/", verifyToken, async (req, res) => {
  try {
    const text = "SELECT * FROM usuarios WHERE email = $1";
    const { rows } = await pool.query(text, [req.email]);
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.post("/register", async (req, res) => {
  try {
    if (!email || !password || !rol || !lenguage) {
      throw { message: "Debe completar todos los campos" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRegister = "INSERT INTO usuarios (email, password, rol, lenguage) VALUES ($1, $2, $3, $4) RETURNING *";
    const { rows } = await pool.query(newRegister, [ email, hashedPassword, rol, lenguage ])
    res.json({ rows })
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password} = req.body;

  try {
    if (!email || !password) {
      throw { code: "400", message: "Debe completar todos los campos" };
    }
//Verificar credenciales
    const text = "SELECT * FROM usuarios WHERE email =$1"
    const {rows: [userDB], rowCount } = await pool.query(text, [email])

    console.log({userDB, rowCount});

    if(!rowCount){
      throw { message: "No existe este usuario"};
    }

    const verifyPassword = await bcrypt.compare(password, userDB.password)
    if(!verifyPassword){
      throw { message: "Contraseña incorrecta"};
    }
  

//generar el JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "3m",
    });
    
    res.json({ token });

    const userId = userDB.id;
		const userLogin = { userId, email, token };
		return userLogin;
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
