/**
 * @file tickets-template.js
 * @description Manages fetching, rendering, and deleting support tickets on the dashboard.
 */

let tickets = [];
let currentSort = "default";

/**
 * Fetches all tickets from the server and updates the UI.
 */
async function fetchTickets() {
  try {
    const response = await fetch("/getTickets");
    if (response.ok) {
      tickets = await response.json();
      renderTickets(tickets);
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
  }
}

/**
 * Renders the list of tickets into the ticket container.
 * @param {Array} tickets - Array of ticket objects to display.
 */
function getSortValue(ticket, sortKey) {
  if (sortKey === "time-oldest" || sortKey === "time-newest") {
    const createdAt = ticket.createdAt ? new Date(ticket.createdAt).getTime() : ticket.id || 0;
    return createdAt;
  }

  if (sortKey === "priority-high-low") {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return priorityMap[ticket.priority] || 0;
  }

  if (sortKey === "priority-low-high") {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return priorityMap[ticket.priority] || 0;
  }

  if (sortKey === "department-asc" || sortKey === "department-desc") {
    return ticket.department || "General";
  }

  return ticket.id || 0;
}

function getSortedTickets(ticketList) {
  const sortedTickets = [...ticketList];

  if (currentSort === "default") {
    return sortedTickets;
  }

  if (currentSort === "time-newest") {
    return sortedTickets.sort((a, b) => getSortValue(b, currentSort) - getSortValue(a, currentSort));
  }

  if (currentSort === "time-oldest") {
    return sortedTickets.sort((a, b) => getSortValue(a, currentSort) - getSortValue(b, currentSort));
  }

  if (currentSort === "priority-high-low") {
    return sortedTickets.sort((a, b) => getSortValue(b, currentSort) - getSortValue(a, currentSort));
  }

  if (currentSort === "priority-low-high") {
    return sortedTickets.sort((a, b) => getSortValue(a, currentSort) - getSortValue(b, currentSort));
  }

  if (currentSort === "department-asc") {
    return sortedTickets.sort((a, b) => getSortValue(a, currentSort).localeCompare(getSortValue(b, currentSort)));
  }

  if (currentSort === "department-desc") {
    return sortedTickets.sort((a, b) => getSortValue(b, currentSort).localeCompare(getSortValue(a, currentSort)));
  }

  return sortedTickets;
}

function renderTickets(tickets) {
  const container = document.getElementById("ticket-container");
  const sortedTickets = getSortedTickets(tickets);

  // Display message if no tickets are found
  if (sortedTickets.length === 0) {
    container.innerHTML = `<h1 class="ticket-title">Tickets</h1>
                               <p class="no-tickets">No, Pending Tickets</p>`;
    return container;
  }

  // Map ticket data to HTML cards
  container.innerHTML =
    `<h1 class="ticket-title">Tickets</h1>` +
    sortedTickets
      .map((ticket) => {
        const createdAt = ticket.createdAt
          ? new Date(ticket.createdAt).toLocaleString()
          : "Unknown";
        return `
    <div class="ticket-card" data-priority="${ticket.priority}">
        <div>
            <h3>#${ticket.id} - ${ticket.title}</h3>
            <p>Description: ${ticket.description}</p>
            <p>Department: ${ticket.department || "General"}</p>
            <p data-priority="${ticket.priority}">Priority: ${ticket.priority}</p>
            <p>Created: ${createdAt}</p>
            <p>Status: ${ticket.status}</p>
            <p><strong>Created By: ${ticket.createdBy}</strong></p>
        </div>
        <div class="ticket-actions">
            <button class="status-btn" data-id="${ticket.id}">Status</button>
            <button class="delete-ticket-btn" data-id="${ticket.id}" id="delete-ticket-button">Delete</button>
        </div>
    </div>
        `;
      })
      .join("");
}

/**
 * Event delegation for ticket deletion.
 * Listens for clicks on delete buttons within the ticket container.
 */
document
  .getElementById("ticket-container")
  .addEventListener("click", async (event) => {
    // Navigate to status page when Status button clicked
    if (event.target.classList.contains("status-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));
      window.location.href = `/pages/status-page.html?ticketId=${ticketId}`;
      return;
    }

    // Check if the clicked element is a delete button
    if (event.target.classList.contains("delete-ticket-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));

      // Optimistically remove the ticket from the local array
      tickets = tickets.filter((t) => t.id !== ticketId);

      try {
        // Send delete request to the server
        const response = await fetch(`/deleteTicket/${ticketId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }

      // Re-render the list to reflect changes
      renderTickets(tickets);
    }
  });

/**
 * Listen for the custom 'ticketCreated' event to add newly created tickets to the list.
 */
document.addEventListener("ticketCreated", (event) => {
  const newTicket = event.detail;

  if (newTicket) {
    tickets.push(newTicket);
    renderTickets(tickets);
  }
});

/**
 * Initialize tickets on page load.
 */
const sortSelect = document.getElementById("ticket-sort");
if (sortSelect) {
  sortSelect.addEventListener("change", (event) => {
    currentSort = event.target.value;
    renderTickets(tickets);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchTickets().catch((error) => {
    console.error("Failed to initialize tickets:", error);
  });
});

// Initial render
renderTickets(tickets);

// Set up polling to keep tickets synchronized with the server every 2 seconds
setInterval(fetchTickets, 2000);
