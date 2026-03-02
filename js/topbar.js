import {loadComponent} from "./utils.js";
import {initTicketForm} from "/js/ticket-form-handler.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("#topbar", "/components/topbar.html");

    const profilePic = document.getElementById("profile-pic");
    const userDropdown = document.getElementById("user-dropdown");

    if (profilePic && userDropdown) {
        // Toggle dropdown on click
        profilePic.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent closing when clicking the pic
            userDropdown.classList.toggle("show");
        });

        // Close dropdown when clicking anywhere else on the page
        window.addEventListener("click", () => {
            if (userDropdown.classList.contains("show")) {
                userDropdown.classList.remove("show");
            }
        });
    }

    initTicketForm();
});
