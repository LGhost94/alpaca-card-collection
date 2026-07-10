// ===============================
// ELEMENTOS PRINCIPAIS
// ===============================

const saveButton = document.getElementById("saveCard");
const cardsList = document.getElementById("cardsList");
const usersList = document.getElementById("usersList");
const saveNewsButton = document.getElementById("saveNews");
const newsList = document.getElementById("newsList");

// Homepage / aparência
const saveHomepageButton = document.getElementById("saveHomepage");
const siteNameInput = document.getElementById("siteName");
const siteLogoInput = document.getElementById("siteLogo");
const siteFaviconInput = document.getElementById("siteFavicon");
const siteLogoPreview = document.getElementById("siteLogoPreview");
const siteFaviconPreview = document.getElementById("siteFaviconPreview");

const homeAdImageInput = document.getElementById("homeAdImage");
const homeBackgroundInput = document.getElementById("homeBackground");
const homeAdPreview = document.getElementById("homeAdPreview");
const homeBackgroundPreview = document.getElementById("homeBackgroundPreview");

const weeklyCardSelect = document.getElementById("weeklyCardId");

let editingCardId = null;

// ===============================
// ABAS DO ADMIN
// ===============================

document.querySelectorAll(".admin-tab").forEach(button => {
    button.addEventListener("click", () => {
        document
            .querySelectorAll(".admin-tab")
            .forEach(btn => btn.classList.remove("active"));

        document
            .querySelectorAll(".admin-section")
            .forEach(section => section.classList.remove("active"));

        button.classList.add("active");

        const section = document.getElementById(button.dataset.tab);

        if (section) {
            section.classList.add("active");
        }
    });
});

// ===============================
// DASHBOARD
// ===============================

async function loadDashboardStats() {
    try {
        const response = await fetch("/api/stats");
        const stats = await response.json();

        document.getElementById("adminStatsUsers").textContent =
            stats.users ?? 0;

        document.getElementById("adminStatsCards").textContent =
            stats.cards ?? 0;

        document.getElementById("adminStatsPacks").textContent =
            stats.packsAvailable ?? 0;

        document.getElementById("adminStatsCollected").textContent =
            stats.cardsCollected ?? 0;

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

// ===============================
// CARTAS
// ===============================

saveButton.addEventListener("click", async () => {
    try {
        const name = document.getElementById("name").value.trim();
        const rarity = document.getElementById("rarity").value;
        const image = document.getElementById("image").files[0];

        if (!name || !rarity) {
            alert("Preenche o nome e a raridade.");
            return;
        }

        if (!editingCardId && !image) {
            alert("Escolhe uma imagem para a carta.");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("rarity", rarity);

        if (image) {
            formData.append("image", image);
        }

        const url = editingCardId
            ? `/api/cards/${editingCardId}`
            : "/api/cards";

        const method = editingCardId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao guardar carta.");
            return;
        }

        alert(
            editingCardId
                ? "Carta editada com sucesso!"
                : "Carta adicionada com sucesso!"
        );

        editingCardId = null;
        saveButton.textContent = "Guardar Carta";

        document.getElementById("name").value = "";
        document.getElementById("image").value = "";

        await loadCards();
        await loadDashboardStats();

    } catch (error) {
        console.error("Erro ao guardar carta:", error);
        alert("Erro ao comunicar com o servidor.");
    }
});

async function loadCards() {
    try {
        const response = await fetch("/api/cards");
        const cards = await response.json();

        cardsList.innerHTML = "";

        // Limpar e voltar a preencher a Carta da Semana
        if (weeklyCardSelect) {
            weeklyCardSelect.innerHTML = `
                <option value="">
                    Nenhuma carta selecionada
                </option>
            `;
        }

        cards.forEach(card => {
            const div = document.createElement("div");
            div.className = "card-admin";

            const safeName = String(card.name).replace(/'/g, "\\'");

            div.innerHTML = `
                <img src="/${card.image}" alt="${card.name}">

                <div>
                    <strong>${card.name}</strong>
                    <p>${card.rarity}</p>
                </div>

                <button
                    onclick="editCard(
                        ${card.id},
                        '${safeName}',
                        '${card.rarity}'
                    )"
                >
                    Editar
                </button>

                <button onclick="deleteCard(${card.id})">
                    Apagar
                </button>
            `;

            cardsList.appendChild(div);

            if (weeklyCardSelect) {
                const option = document.createElement("option");

                option.value = card.id;
                option.textContent = `${card.name} — ${card.rarity}`;

                weeklyCardSelect.appendChild(option);
            }
        });

    } catch (error) {
        console.error("Erro ao carregar cartas:", error);
    }
}

function editCard(id, name, rarity) {
    editingCardId = id;

    document.getElementById("name").value = name;
    document.getElementById("rarity").value = rarity;

    saveButton.textContent = "Guardar Alterações";

    const cardsTab = document.querySelector('[data-tab="cards"]');

    if (cardsTab) {
        cardsTab.click();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deleteCard(id) {
    if (!confirm("Tens a certeza que queres apagar esta carta?")) {
        return;
    }

    try {
        const response = await fetch(`/api/cards/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao apagar carta.");
            return;
        }

        await loadCards();
        await loadDashboardStats();

    } catch (error) {
        console.error("Erro ao apagar carta:", error);
        alert("Erro ao comunicar com o servidor.");
    }
}

// ===============================
// UTILIZADORES
// ===============================

async function loadUsers() {
    try {
        const response = await fetch("/api/users");
        const users = await response.json();

        usersList.innerHTML = "";

        users.forEach(user => {
            const div = document.createElement("div");

            div.className = "user-admin";

            div.innerHTML = `
                <img
                    src="${user.profile_image || "/images/alpaca.png"}"
                    alt="${user.username}"
                >

                <div>
                    <strong>${user.username}</strong>
                    <p>Packs: ${user.packs}</p>
                    <p>
                        ${
                            user.is_admin
                                ? "👑 Admin"
                                : "Utilizador normal"
                        }
                    </p>
                </div>

                <button onclick="addPacks(${user.id}, 1)">
                    +1 Pack
                </button>

                <button onclick="addPacks(${user.id}, 5)">
                    +5 Packs
                </button>

                <button onclick="addPacks(${user.id}, 10)">
                    +10 Packs
                </button>

                <button onclick="toggleAdmin(${user.id})">
                    ${
                        user.is_admin
                            ? "Remover Admin"
                            : "Tornar Admin"
                    }
                </button>
            `;

            usersList.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar utilizadores:", error);
    }
}

async function addPacks(id, amount) {
    try {
        const response = await fetch(
            `/api/users/${id}/add-packs`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ amount })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao adicionar packs.");
            return;
        }

        await loadUsers();
        await loadDashboardStats();

    } catch (error) {
        console.error("Erro ao adicionar packs:", error);
        alert("Erro ao comunicar com o servidor.");
    }
}

async function toggleAdmin(id) {
    try {
        const response = await fetch(
            `/api/users/${id}/toggle-admin`,
            {
                method: "POST"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao alterar admin.");
            return;
        }

        await loadUsers();

    } catch (error) {
        console.error("Erro ao alterar administrador:", error);
        alert("Erro ao comunicar com o servidor.");
    }
}

// ===============================
// NOTÍCIAS
// ===============================

saveNewsButton.addEventListener("click", async () => {
    try {
        const title = document
            .getElementById("newsTitle")
            .value
            .trim();

        const content = document
            .getElementById("newsContent")
            .value
            .trim();

        if (!title || !content) {
            alert("Preenche o título e o texto da notícia.");
            return;
        }

        const response = await fetch("/api/news", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                content
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao publicar notícia.");
            return;
        }

        document.getElementById("newsTitle").value = "";
        document.getElementById("newsContent").value = "";

        await loadNews();

    } catch (error) {
        console.error("Erro ao publicar notícia:", error);
        alert("Erro ao comunicar com o servidor.");
    }
});

async function loadNews() {
    try {
        const response = await fetch("/api/news");
        const news = await response.json();

        newsList.innerHTML = "";

        news.forEach(item => {
            const div = document.createElement("div");

            div.className = "news-admin";

            div.innerHTML = `
                <div>
                    <strong>${item.title}</strong>
                    <p>${item.content}</p>
                </div>

                <button onclick="deleteNews(${item.id})">
                    Apagar
                </button>
            `;

            newsList.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar notícias:", error);
    }
}

async function deleteNews(id) {
    if (!confirm("Queres apagar esta notícia?")) {
        return;
    }

    try {
        const response = await fetch(`/api/news/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.error || "Erro ao apagar notícia.");
            return;
        }

        await loadNews();

    } catch (error) {
        console.error("Erro ao apagar notícia:", error);
        alert("Erro ao comunicar com o servidor.");
    }
}

// ===============================
// PRÉ-VISUALIZAÇÃO DE IMAGENS
// ===============================

function previewImage(input, previewElement) {
    const file = input.files[0];

    if (!file || !previewElement) {
        return;
    }

    previewElement.src = URL.createObjectURL(file);
}

siteLogoInput.addEventListener("change", () => {
    previewImage(siteLogoInput, siteLogoPreview);
});

siteFaviconInput.addEventListener("change", () => {
    previewImage(siteFaviconInput, siteFaviconPreview);
});

homeAdImageInput.addEventListener("change", () => {
    previewImage(homeAdImageInput, homeAdPreview);
});

homeBackgroundInput.addEventListener("change", () => {
    previewImage(
        homeBackgroundInput,
        homeBackgroundPreview
    );
});

// ===============================
// DEFINIÇÕES / HOMEPAGE
// ===============================

async function loadSettings() {
    try {
        const response = await fetch("/api/settings");
        const settings = await response.json();

        siteNameInput.value =
            settings.siteName || "Alpaca Cromos";

        document.getElementById("homeTitle").value =
            settings.homeTitle || "Alpaca Cromos";

        document.getElementById("homeSubtitle").value =
            settings.homeSubtitle ||
            "Abre packs, descobre cartas exclusivas e completa a tua coleção da comunidade.";

        document.getElementById("homeAdLink").value =
            settings.homeAdLink ||
            "https://www.etsy.com/";

        if (settings.siteLogo) {
            siteLogoPreview.src = settings.siteLogo;
        }

        if (settings.siteFavicon) {
            siteFaviconPreview.src = settings.siteFavicon;
        }

        if (settings.homeAdImage) {
            homeAdPreview.src = settings.homeAdImage;
        }

        if (settings.homeBackground) {
            homeBackgroundPreview.src =
                settings.homeBackground;
        }

        if (
            weeklyCardSelect &&
            settings.weeklyCardId
        ) {
            weeklyCardSelect.value =
                String(settings.weeklyCardId);
        }

    } catch (error) {
        console.error("Erro ao carregar definições:", error);
    }
}

saveHomepageButton.addEventListener("click", async () => {
    try {
        const formData = new FormData();

        formData.append(
            "siteName",
            siteNameInput.value.trim()
        );

        formData.append(
            "homeTitle",
            document.getElementById("homeTitle").value.trim()
        );

        formData.append(
            "homeSubtitle",
            document.getElementById("homeSubtitle").value.trim()
        );

        formData.append(
            "homeAdLink",
            document.getElementById("homeAdLink").value.trim()
        );

        if (weeklyCardSelect) {
            formData.append(
                "weeklyCardId",
                weeklyCardSelect.value
            );
        }

        if (siteLogoInput.files[0]) {
            formData.append(
                "siteLogo",
                siteLogoInput.files[0]
            );
        }

        if (siteFaviconInput.files[0]) {
            formData.append(
                "siteFavicon",
                siteFaviconInput.files[0]
            );
        }

        if (homeAdImageInput.files[0]) {
            formData.append(
                "homeAdImage",
                homeAdImageInput.files[0]
            );
        }

        if (homeBackgroundInput.files[0]) {
            formData.append(
                "homeBackground",
                homeBackgroundInput.files[0]
            );
        }

        const response = await fetch("/api/settings", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(
                result.error ||
                "Erro ao guardar definições."
            );
            return;
        }
        const weeklyResponse = await fetch(
    "/api/settings/weekly-card",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            weeklyCardId: weeklyCardSelect.value
        })
    }
);

const weeklyResult = await weeklyResponse.json();

if (!weeklyResponse.ok || !weeklyResult.success) {
    alert(
        weeklyResult.error ||
        "Erro ao guardar a Carta da Semana."
    );
    return;
}

        alert("Definições guardadas com sucesso!");

        siteLogoInput.value = "";
        siteFaviconInput.value = "";
        homeAdImageInput.value = "";
        homeBackgroundInput.value = "";

        await loadSettings();

    } catch (error) {
        console.error("Erro ao guardar definições:", error);
        alert("Erro ao comunicar com o servidor.");
    }
});

// ===============================
// INICIALIZAÇÃO
// ===============================

async function initializeAdmin() {
    await Promise.all([
        loadDashboardStats(),
        loadCards(),
        loadUsers(),
        loadNews()
    ]);

    // Importante: carregar depois das cartas,
    // para o seletor já ter as opções.
    await loadSettings();
}

initializeAdmin();