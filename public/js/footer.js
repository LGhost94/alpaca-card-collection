document.addEventListener("DOMContentLoaded", () => {
    const footer = document.createElement("footer");

    footer.className = "site-footer";

    footer.innerHTML = `
        <div class="footer-content">

            <div class="footer-left">

                <img
                    src="/images/alpaca.png"
                    class="footer-logo"
                    alt="Logo"
                >

                <div>
                    <strong>Alpaca Card Collection</strong>

                    <p>
                        © 2026 Todos os direitos reservados.
                    </p>
                </div>

            </div>

            <div class="footer-right">

                <p>Versão 1.0</p>

                <p>
                    Criado por José Correia
                </p>

            </div>

        </div>
    `;

    document.body.appendChild(footer);
});