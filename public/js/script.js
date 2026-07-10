async function checkLogin() {
    try {
        const response = await fetch("/api/me");
        const user = await response.json();

        const homeButtons = document.getElementById("homeButtons");

        if (!homeButtons) {
            return;
        }

        if (user.loggedIn) {
            homeButtons.innerHTML = `
                <a href="/packs" class="loginButton">Abrir Packs</a>
                <a href="/collection" class="loginButton">Coleção</a>
                <a href="/profile" class="loginButton">Perfil</a>
            `;
        }
    } catch (error) {
        console.error("Erro ao verificar login:", error);
    }
}

async function loadStats() {
    try {
        const response = await fetch("/api/stats");
        const stats = await response.json();

        const usersElement = document.getElementById("statsUsers");
        const cardsElement = document.getElementById("statsCards");
        const packsElement = document.getElementById("statsPacks");
        const collectedElement = document.getElementById("statsCollected");

        if (usersElement) {
            usersElement.textContent = stats.users ?? 0;
        }

        if (cardsElement) {
            cardsElement.textContent = stats.cards ?? 0;
        }

        if (packsElement) {
            packsElement.textContent = stats.packsAvailable ?? 0;
        }

        if (collectedElement) {
            collectedElement.textContent = stats.cardsCollected ?? 0;
        }
    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

async function loadHomepage() {
    try {
        const [settingsResponse, cardsResponse] = await Promise.all([
            fetch("/api/settings"),
            fetch("/api/cards")
        ]);

        const settings = await settingsResponse.json();
        const cards = await cardsResponse.json();

        const title = document.querySelector(".home-text h1");
        const subtitle = document.querySelector(".home-text p");
        const adLink = document.querySelector(".home-ad");
        const adImage = document.querySelector(".home-ad img");
        const home = document.querySelector(".home-v2");

        if (title && settings.homeTitle) {
            title.textContent = settings.homeTitle;
        }

        if (subtitle && settings.homeSubtitle) {
            subtitle.textContent = settings.homeSubtitle;
        }

        if (adLink && settings.homeAdLink) {
            adLink.href = settings.homeAdLink;
        }

        if (adImage && settings.homeAdImage) {
            adImage.src = settings.homeAdImage;
        }

        if (home && settings.homeBackground) {
            home.style.background = `
                linear-gradient(
                    rgba(15, 15, 18, 0.75),
                    rgba(15, 15, 18, 0.95)
                ),
                url("${settings.homeBackground}")
            `;

            home.style.backgroundSize = "cover";
            home.style.backgroundPosition = "center";
            home.style.backgroundRepeat = "no-repeat";
        }

        loadWeeklyCard(settings, cards);
    } catch (error) {
        console.error("Erro ao carregar a homepage:", error);
    }
}

function loadWeeklyCard(settings, cards) {
    const weeklyCardBox = document.querySelector(".weekly-card");

    if (!weeklyCardBox) {
        return;
    }

    if (!settings.weeklyCardId) {
        weeklyCardBox.innerHTML = `
            <div class="missing-card">?</div>

            <strong style="
                display:block;
                margin-top:12px;
                font-size:18px;
            ">
                Nenhuma carta selecionada
            </strong>

            <span style="
                display:block;
                margin-top:6px;
                color:#aaa;
                font-size:14px;
            ">
                Escolhe uma carta no Admin
            </span>
        `;
        return;
    }

    const weeklyCard = cards.find(
        card => String(card.id) === String(settings.weeklyCardId)
    );

    if (!weeklyCard) {
        weeklyCardBox.innerHTML = `
            <div class="missing-card">?</div>

            <strong style="
                display:block;
                margin-top:12px;
                font-size:18px;
            ">
                Carta não encontrada
            </strong>

            <span style="
                display:block;
                margin-top:6px;
                color:#aaa;
                font-size:14px;
            ">
                Escolhe outra carta no Admin
            </span>
        `;
        return;
    }

    weeklyCardBox.innerHTML = `
        <img
            src="/${weeklyCard.image}"
            alt="${weeklyCard.name}"
            style="
                width:140px;
                height:200px;
                object-fit:cover;
                border-radius:14px;
                display:block;
                margin:0 auto;
                box-shadow:0 10px 25px rgba(0,0,0,.45);
            "
        >

        <strong style="
            display:block;
            margin-top:14px;
            font-size:20px;
            line-height:1.2;
        ">
            ${weeklyCard.name}
        </strong>

        <span style="
            display:block;
            margin-top:6px;
            color:#b88cff;
            font-weight:bold;
            font-size:16px;
        ">
            ${weeklyCard.rarity}
        </span>
    `;
}

async function loadNews() {
    try {
        const response = await fetch("/api/news");
        const news = await response.json();

        const newsContainer = document.getElementById("homeNewsList");

        if (!newsContainer) {
            return;
        }

        if (!Array.isArray(news) || news.length === 0) {
            newsContainer.innerHTML = `
                <p>Ainda não existem notícias publicadas.</p>
            `;
            return;
        }

        newsContainer.innerHTML = news
            .slice(0, 3)
            .map(item => `
                <article class="home-news-item">
                    <h3>${item.title}</h3>
                    <p>${item.content}</p>
                </article>
            `)
            .join("");
    } catch (error) {
        console.error("Erro ao carregar notícias:", error);
    }
}

async function initializeHomepage() {
    await Promise.all([
        checkLogin(),
        loadStats(),
        loadHomepage(),
        loadNews()
    ]);
}

initializeHomepage();