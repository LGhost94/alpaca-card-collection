async function loadProfile() {
    try {
        const response = await fetch("/api/me");
        const user = await response.json();

        if (!response.ok || !user.loggedIn) {
            window.location.href = "/";
            return;
        }

        document.getElementById("profileName").textContent =
            user.username || "Utilizador";

        document.getElementById("profileImage").src =
            user.profile_image || "/images/alpaca.png";

        document.getElementById("packsCount").textContent =
            user.packs ?? 0;

        document.getElementById("cardsCount").textContent =
            user.totalCards ?? 0;

        document.getElementById("uniqueCardsCount").textContent =
            user.uniqueCards ?? 0;

        document.getElementById("internalId").textContent =
            user.id ?? "-";

        document.getElementById("twitchId").textContent =
            user.twitch_id ?? "-";

        document.getElementById("isAdmin").textContent =
            user.is_admin ? "Sim" : "Não";

        const adminButton =
            document.getElementById("adminButton");

        if (user.is_admin) {
            adminButton.classList.remove("hidden");
        } else {
            adminButton.classList.add("hidden");
        }

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Não foi possível carregar o perfil.");
    }
}

const toggleIdsButton =
    document.getElementById("toggleIdsButton");

const idsBox =
    document.getElementById("idsBox");

toggleIdsButton.addEventListener("click", () => {
    idsBox.classList.toggle("hidden");
});

loadProfile();