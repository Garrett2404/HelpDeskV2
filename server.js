import express from "express";
import morgan from "morgan";
import Database from "better-sqlite3";

const app = express();
const PORT = 8000;
// const adminUsername = "admin";
// const adminPassword = "admin";
// const userUsername = "user";
// const userPassword = "user";

const db = new Database("tickets.db");
const userDB = new Database("users.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        createdBy TEXT NOT NULL
    )
`);

userDB.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
    )
`);

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

const seedUsers = userDB.prepare("SELECT COUNT(*) AS count FROM users").get();
if (seedUsers && seedUsers.count === 0) {
    userDB.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "passwordAdmin", "admin");
    userDB.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("user", "passwordUser", "user");
    console.log("Database seeded with default users.");
}

app.post("/registerUser", (req, res) => {
    const { username, password } = req.body;

    try {
        const result = userDB.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);

        res.json({
            success: true,
            message: "User created successfully",
            newUser: { id: result.lastInsertRowid, username: username }
        });
    } catch (error) {
        // If username already exists, SQLite throws a 'SQLITE_CONSTRAINT_UNIQUE' error due to the UNIQUE constraint in userDB
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ success: false, message: "Username already exists. Please choose another." });
        }

        // Handle other errors
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    try {
        const user = userDB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);

        if (user) {
            res.json({ success: true, message: `Logged in as ${user.role}`, user: { id: user.id, username: user.username, role: user.role } });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/createTicket", (req, res) => {
    console.log("Server-Side ticket data:", req.body);

    const { ticketTitle, ticketDescription, ticketPriority, createdBy } = req.body;

    if (ticketTitle && ticketDescription && ticketPriority) {
        try {
            const insertTicket = db.prepare(`
                INSERT INTO tickets (title, description, priority, status, createdBy)
                VALUES (?, ?, ?, ?, ?)
            `);

            const newTicket = {
                title: ticketTitle,
                description: ticketDescription,
                priority: ticketPriority,
                status: "pending",
                createdBy: createdBy
            };

            insertTicket.run(newTicket.title, newTicket.description, newTicket.priority, newTicket.status, newTicket.createdBy);
            console.log("Ticket saved to database.");

            res.json({ success: true, message: "Ticket created successfully", ticket: newTicket });
        } catch (error) {
            console.error("Error creating ticket:", error);
            res.status(500).json({ success: false, message: "Error creating ticket" });
        }
    } else {
        res.status(400).json({ success: false, message: "Missing required fields" });
    }
});

app.get("/getTickets", (req, res) => {
    try {
        const tickets = db.prepare("SELECT * FROM tickets").all();
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ success: false, message: "Error fetching tickets" });
    }
});

app.delete("/deleteTicket/:id", (req, res) => {
    const ticketID = parseInt(req.params.id);

    try {
        const result = db.prepare("DELETE FROM tickets WHERE id = ?").run(ticketID);

        if (result.changes > 0) {
            res.json({ success: true, message: "Ticket deleted from database successfully" });
        } else {
            res.status(404).json({ success: false, message: "Ticket not found" });
        }
    } catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ success: false, message: "Error deleting ticket" });
    }
});
