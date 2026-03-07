const loginForm = document.getElementById("register-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/registerUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Registration Successful:", data.message);
            // sessionStorage.setItem("userData", JSON.stringify(data.user));
            window.location.href = "/pages/login-page.html";
        } else {
            console.error("registration failed", data.message);
            const errorMsg = document.getElementById("error-msg");
            if (errorMsg) {
                errorMsg.textContent = data.message;
                errorMsg.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error during registration:", error);
    }

});