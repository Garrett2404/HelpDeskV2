import {loadComponent} from "./utils.js";

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

    const testButton = document.getElementById("test-button");
    const testDropdown = document.getElementById("test-dropdown");

    if (testButton && testDropdown) {
        testButton.addEventListener("click", (event) => {
            event.stopPropagation()
            testDropdown.classList.toggle("show");
        });

        window.addEventListener("click", () => {
            if (testDropdown.classList.contains("show")) {
                testDropdown.classList.remove("show");
            }
        });
    }

    const createTicketBtn = document.getElementById("create-ticket-btn");
    const ticketModal = document.getElementById("ticket-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const ticketForm = document.getElementById("ticket-form");

    if (createTicketBtn && ticketModal) {
        createTicketBtn.addEventListener("click", () => {
            ticketModal.classList.remove("hidden");
        });

        closeModalBtn.addEventListener("click", () => {
            ticketModal.classList.add("hidden");
        });

        // Close when clicking outside the modal box
        // ticketModal.addEventListener("click", (event) => {
        //     if (event.target === ticketModal) {
        //         ticketModal.classList.add("hidden");
        //     }
        // });

        ticketForm.addEventListener("submit", (event) => {
            event.preventDefault();
            // Handle form submission here
            console.log("Ticket submitted!");
            ticketModal.classList.add("hidden");
        });
    }
});
