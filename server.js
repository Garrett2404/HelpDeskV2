import express from "express";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static("./")); // serve from project root

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});