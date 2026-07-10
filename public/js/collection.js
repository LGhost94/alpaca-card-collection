let allCollectionCards = [];
let currentFilter = "Todas";
let currentPage = 1;
const cardsPerPage = 12;

const grid = document.getElementById("collectionGrid");
const searchInput = document.getElementById("searchInput");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const pageInfo = document.getElementById("pageInfo");
const albumTitle = document.getElementById("albumTitle");

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderCards();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage < totalPages) {
        currentPage++;
        renderCards();
    }
});

searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderCards();
});

async function loadCollection() {
    const cardsResponse = await fetch("/api/cards");
    const allCards = await cardsResponse.json();

    const collectionResponse = await fetch("/api/collection");
    const ownedCards = await collectionResponse.json();

    allCollectionCards = allCards.map(card => {
        const owned = ownedCards.find(item => item.card_id === card.id);

        return {
            ...card,
            quantity: owned ? owned.quantity : 0
        };
    });

    updateProgress();
    renderCards();
}

function setFilter(filter) {
    currentFilter = filter;
    currentPage = 1;
    renderCards();
}

function getFilteredCards() {
    const search = searchInput.value.toLowerCase();

    return allCollectionCards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(search);

        if (!matchesSearch) return false;

        if (currentFilter === "Todas") return true;
        if (currentFilter === "Tenho") return card.quantity > 0;
        if (currentFilter === "Faltam") return card.quantity === 0;

        return card.rarity === currentFilter;
    });
}

function getTotalPages() {
    return Math.max(1, Math.ceil(getFilteredCards().length / cardsPerPage));
}

function renderCards() {
    const filtered = getFilteredCards();
    const totalPages = getTotalPages();

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * cardsPerPage;
    const pageCards = filtered.slice(start, start + cardsPerPage);

    grid.innerHTML = "";

    pageCards.forEach(card => {
        const div = document.createElement("div");
        div.className = card.quantity > 0 ? "collection-card owned" : "collection-card locked";

        div.innerHTML = `
            <div class="card-number">#${card.id}</div>

            ${
                card.quantity > 0
                    ? `<img src="/${card.image}" alt="${card.name}">`
                    : `<div class="missing-card">?</div>`
            }

            <h3>${card.quantity > 0 ? card.name : "???"}</h3>
            <p>${card.rarity}</p>
            <span>${card.quantity > 0 ? "x" + card.quantity : "Por descobrir"}</span>
        `;

        grid.appendChild(div);
    });

    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    albumTitle.textContent = `Página ${currentPage}`;
}

function updateProgress() {
    const total = allCollectionCards.length;
    const owned = allCollectionCards.filter(card => card.quantity > 0).length;
    const percent = total === 0 ? 0 : Math.round((owned / total) * 100);

    progressText.textContent = `${owned} / ${total} cartas`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

loadCollection();