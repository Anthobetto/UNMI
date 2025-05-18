import { supabase } from "./db";
import { Express } from "express";

export function setupAuth(app: Express) {

  // 🔐 Registro
  app.post("/api/register", async (req, res) => {
    console.log("Se alcanzó la ruta de registro");

    const { username, email, password } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Error en el registro:", authError.message);
      return res.status(400).json({ message: authError.message });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          auth_id: authData.user?.id
        }
      ]);


    if (error) {
      console.error('Error al insertar usuario:', error.message);
      return res.status(500).send(error.message);
    }

    console.log('Usuario registrado correctamente:', username, email);
    res.status(201).json({ message: "Registro exitoso", user: data });
  });

  // 🔐 Login
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase.auth.signInWithPassword({email, password})

    if (error || !user) {
      console.error("❌ Usuario no encontrado o error en la búsqueda");
      return res.status(400).json({ message: "Usuario no encontrado", error, user });
    }

    res.status(200).json({ message: "Login exitoso", user });
  });

  // 🔎 Obtener usuario
  app.get("/api/user", async (req, res) => {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Error obteniendo el usuario:", error.message);
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({ user: data.user });
  });

  // 🔐 Logout
  app.post("/api/logout", (req, res) => {
    res.clearCookie("accessToken");
    res.status(200).json({ message: "Logout exitoso" });
  });
}