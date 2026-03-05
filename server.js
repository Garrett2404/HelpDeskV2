import express from "express";
import morgan from "morgan";

const app = express();
const PORT = 8000;
const adminUsername = "admin";
const adminPassword = "admin";
const userUsername = "user";
const userPassword = "user";

app.use(express.json());

// HTTP request logging
app.use(morgan("dev"));

app.use(express.static("./", { index: false }));

app.get("/", (req, res) => {
    res.sendFile("pages/login-page.html", { root: "./" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on your IP address or localhost:${PORT}`);
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === adminUsername && password === adminPassword) {
        res.json({ success: true, message: "Logged in as admin" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});