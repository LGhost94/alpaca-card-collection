async function loadSiteSettings() {
    try {
        const response = await fetch("/api/settings");
        const settings = await response.json();

        const siteName = settings.siteName || "Alpaca Cromos";
        const siteLogo = settings.siteLogo || "/images/alpaca.png";
        const siteFavicon = settings.siteFavicon || "/images/alpaca.png?v=3";

        document.title = siteName;

        document.querySelectorAll(".logo").forEach(logo => {
            logo.innerHTML = `
                <img src="${siteLogo}" class="logo-img">
                ${siteName}
            `;
        });

        let favicon = document.querySelector("link[rel='icon']");

        if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
        }

        favicon.href = siteFavicon;

    } catch (error) {
        console.error("Erro ao carregar definições do site:", error);
    }
}

loadSiteSettings();