let tickets = [];

function renderTickets(tickets) {
    const container = document.getElementById("ticket-container");

    if (tickets.length === 0) {
        container.innerHTML = `<h1 class="ticket-title">Tickets</h1>
                               <p class="no-tickets">No, Pending Tickets</p>`;
        return container;
    }

    container.innerHTML = `<h1 class="ticket-title">Tickets</h1>` + tickets.map(ticket => `
        <div class="ticket-card" data-priority="${ticket.priority}">
            <h3>#${ticket.id} - ${ticket.title}</h3>
            <p data-priority="${ticket.priority}">Priority: ${ticket.priority}</p>
            <p>Status: ${ticket.status}</p>
        </div>
        `).join("");
}

document.addEventListener("ticketCreated", (event) => {
    const newTicket = {
        id: tickets.length + 1,
        ...event.detail
    };
    tickets.push(newTicket);
    renderTickets(tickets);
});

renderTickets(tickets);