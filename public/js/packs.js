const openPackButton = document.getElementById("openPackButton");
const cardsReveal = document.getElementById("cardsReveal");
const packBox = document.getElementById("packBox");
const packMessage = document.getElementById("packMessage");
const goCollectionButton = document.getElementById("goCollectionButton");

let openedCards = [];
let currentIndex = 0;

openPackButton.addEventListener("click", async () => {
    cardsReveal.innerHTML = "";
    goCollectionButton.classList.add("hidden");

    packBox.classList.add("opening");
    openPackButton.disabled = true;
    openPackButton.textContent = "A abrir...";
    packMessage.textContent = "O pack está a abrir...";

    try {
        const response = await fetch("/api/cards/open-pack", {
            method: "POST"
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.error || "Erro ao abrir pack.");

            packBox.classList.remove("opening");
            openPackButton.disabled = false;
            openPackButton.textContent = "Abrir Pack";
            packMessage.textContent = "Abre um pack e revela 5 cartas da tua coleção.";
            return;
        }

        openedCards = result.cards;
        currentIndex = 0;

        setTimeout(() => {
            packBox.classList.remove("opening");
            packBox.classList.add("opened");
            openPackButton.style.display = "none";

            showNextCard();
        }, 1200);

    } catch (error) {
        console.error(error);
        alert("Erro ao comunicar com o servidor.");
    }
});

function showNextCard() {
    cardsReveal.innerHTML = "";

    if (currentIndex >= openedCards.length) {
        packMessage.textContent = "Pack aberto com sucesso!";
        goCollectionButton.classList.remove("hidden");
        return;
    }

    const card = openedCards[currentIndex];

    packMessage.textContent = `Carta ${currentIndex + 1} de ${openedCards.length}`;

    const cardDiv = document.createElement("div");
    cardDiv.className = `flip-card single-card ${card.rarity.toLowerCase()}`;

    cardDiv.innerHTML = `
        <div class="flip-inner">
            <div class="flip-front">
                <span>?</span>
            </div>

            <div class="flip-back">
                <img src="/${card.image}" alt="${card.name}">
                <h3>${card.name}</h3>
                <p>${card.rarity}</p>
            </div>
        </div>
    `;

    cardDiv.addEventListener("click", () => {
        cardDiv.classList.add("revealed");

        setTimeout(() => {
            currentIndex++;
            showNextCard();
        }, 1400);
    });

    cardsReveal.appendChild(cardDiv);
}