/**
 * @file login-page.js
 * @description Handles user login authentication and navigation to registration.
 */

const loginForm = document.getElementById("login-form");
const signUp = document.getElementById("sign-up-button");

/**
 * Handle login form submission.
 * Sends credentials to the server and manages the session on success.
 */

/* hardcoded credentials for testing */
/*const admin_username = "admin1";
const admin_password = "adminpassword";

const client_username = "client1";
const client_password = "clientpassword";

const employee_username = "employee1";
const employee_password = "employeepassword";*/

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        // Send login request to the server
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Login successful:", data.message);
            // Store session data in sessionStorage
            localStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("userData", JSON.stringify(data.user));
            // Redirect to the main dashboard
            window.location.href = "/index.html";
        } else {
            console.error("login failed", data.message);
            // Display error message to the user
            const errorMsg = document.getElementById("error-msg");
            if (errorMsg) {
                errorMsg.textContent = data.message;
                errorMsg.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
    }

});

/**
 * Redirect to the user registration page when the sign-up button is clicked.
 */
signUp.addEventListener("click", () => {
    window.location.href = "/pages/user-registration.html";
});