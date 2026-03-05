import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// JWT Secret
const SECRET = process.env.JWT_SECRET || "finngru_secret";

// --- Authentication ---
// Register User
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from("users")
        .insert([{ name, email, password: hashedPassword, role }])
        .select();

    if (error) return res.status(400).json({ error: error.message });

    const token = jwt.sign({ id: data[0].id }, SECRET, { expiresIn: "7d" });
    res.json({ user: data[0], token });
});

// Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !data) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, data.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: data.id }, SECRET, { expiresIn: "7d" });
    res.json({ user: data, token });
});

// --- Example: Get Freelance Projects ---
app.get("/projects", async (req, res) => {
    const { data, error } = await supabase.from("freelance_projects").select("*");
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// --- Example: Add Stock Prediction ---
app.post("/stock-predictions", async (req, res) => {
    const { user_id, stock_name, predicted_price, predicted_time } = req.body;
    const { data, error } = await supabase.from("stock_predictions")
        .insert([{ user_id, stock_name, predicted_price, predicted_time }])
        .select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

