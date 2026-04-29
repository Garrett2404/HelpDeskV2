/**
 * @file server.js
 * @description Main entry point for the HelpDeskV2 Express server.
 * Handles user authentication, ticket management, and serves static files.
 */

import express from "express";
import morgan from "morgan";
import Database from "better-sqlite3";

const app = express();
const PORT = 8000;

// Initialize databases
// tickets.db stores support ticket information
// users.db stores user credentials and roles
const ticketsDB = new Database("tickets.db");
const userDB = new Database("users.db");

/**
 * Initialize the 'tickets' table if it doesn't exist.
 */
ticketsDB.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT 'General',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        createdBy TEXT NOT NULL
    )
`);

// Add missing columns to existing tickets table if they do not exist
const ticketColumns = ticketsDB.prepare("PRAGMA table_info(tickets)").all();
if (!ticketColumns.some((column) => column.name === "department")) {
    ticketsDB.prepare("ALTER TABLE tickets ADD COLUMN department TEXT NOT NULL DEFAULT 'General'").run();
}
if (!ticketColumns.some((column) => column.name === "createdAt")) {
    ticketsDB.prepare("ALTER TABLE tickets ADD COLUMN createdAt TEXT").run();
    ticketsDB.prepare("UPDATE tickets SET createdAt = datetime('now') WHERE createdAt IS NULL").run();
}

/**
 * Initialize the 'users' table if it doesn't exist.
 */
userDB.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
    )
`);

// Middleware configuration
app.use(express.json()); // Parse JSON request bodies

// HTTP request logging for development
app.use(morgan("dev"));

// Serve static files from the project root
app.use(express.static("./", { index: false }));

/**
 * Default route: Serves the login page.
 */
app.get("/", (req, res) => {
    res.sendFile("pages/login-page.html", { root: "./" });
});

/**
 * Start the server and listen on all network interfaces.
 */
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on your IP address or localhost:${PORT}`);
});

/**
 * Database Seeding: Creates default 'admin' and 'user' accounts if the database is empty.
 */
const seedUsers = userDB.prepare("SELECT COUNT(*) AS count FROM users").get();
if (seedUsers && seedUsers.count === 0) {
    userDB.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "passwordAdmin", "admin");
    userDB.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("user", "passwordUser", "user");
    console.log("Database seeded with default users.");
}

/**
 * POST /registerUser
 * Registers a new user in the system.
 * @param {string} req.body.username
 * @param {string} req.body.password
 */
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
        // If username already exists, SQLite throws a 'SQLITE_CONSTRAINT_UNIQUE' error
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ success: false, message: "Username already exists. Please choose another." });
        }

        // Handle other internal server errors
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * POST /login
 * Authenticates a user based on username and password.
 * @param {string} req.body.username
 * @param {string} req.body.password
 */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    try {
        const user = userDB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);

        if (user) {
            res.json({ 
                success: true, 
                message: `Logged in as ${user.role}`, 
                user: { id: user.id, username: user.username, role: user.role } 
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * POST /createTicket
 * Creates a new support ticket and saves it to the database.
 * @param {string} req.body.ticketTitle
 * @param {string} req.body.ticketDescription
 * @param {string} req.body.ticketPriority
 * @param {string} req.body.createdBy
 */
app.post("/createTicket", (req, res) => {
    console.log("Server-Side ticket data:", req.body);

    const { ticketTitle, ticketDescription, ticketPriority, ticketDepartment, createdBy } = req.body;
    const normalizedDepartment = ticketDepartment || "General";

    if (ticketTitle && ticketDescription && ticketPriority) {
        try {
            const createdAt = new Date().toISOString();
            const insertTicket = ticketsDB.prepare(`
                INSERT INTO tickets (title, description, priority, department, createdAt, status, createdBy)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const newTicket = {
                title: ticketTitle,
                description: ticketDescription,
                priority: ticketPriority,
                department: normalizedDepartment,
                createdAt,
                status: "pending",
                createdBy: createdBy
            };

            insertTicket.run(newTicket.title, newTicket.description, newTicket.priority, newTicket.department, newTicket.createdAt, newTicket.status, newTicket.createdBy);
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

/**
 * GET /getTickets
 * Retrieves all support tickets from the database.
 */
app.get("/getTickets", (req, res) => {
    try {
        const tickets = ticketsDB.prepare("SELECT * FROM tickets").all();
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ success: false, message: "Error fetching tickets" });
    }
});

/**
 * DELETE /deleteTicket/:id
 * Removes a ticket from the database by its ID.
 * @param {number} req.params.id - The ID of the ticket to delete.
 */
app.delete("/deleteTicket/:id", (req, res) => {
    const ticketID = parseInt(req.params.id);

    try {
        const result = ticketsDB.prepare("DELETE FROM tickets WHERE id = ?").run(ticketID);

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
