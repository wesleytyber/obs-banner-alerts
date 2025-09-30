document.addEventListener('DOMContentLoaded', () => {

    // ----------------- Ícones -----------------
    const icons = {
        twitch: `<svg fill="#9146FF" viewBox="0 0 24 24"><path d="M3 0 1 4v16h6v4h4l4-4h6l6-6V0H3zm18 12-3 3h-6l-4 4v-4H5V2h16v10z"/><path d="M15 5h2v6h-2zm-5 0h2v6h-2z"/></svg>`,
        kick: `<svg fill="#53FC18" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/></svg>`,
        youtube: `<svg fill="#FF0000" viewBox="0 0 24 24"><path d="M23.5 6.2s-.2-1.7-.9-2.4c-.9-.9-1.9-.9-2.4-1C16.7 2.5 12 2.5 12 2.5h-.1s-4.7 0-8.2.3c-.5.1-1.6.1-2.4 1-.7.7-.9 2.4-.9 2.4S0 8.1 0 10v1.9c0 1.9.2 3.8.2 3.8s.2 1.7.9 2.4c.9.9 2.1.9 2.6 1 1.9.2 7.9.3 7.9.3s4.7 0 8.2-.3c.5-.1 1.6-.1 2.4-1 .7-.7.9-2.4.9-2.4s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8zM9.5 14.7V7.7l6.5 3.5-6.5 3.5z"/></svg>`
    };

    // ----------------- Chats -----------------
    function handleChat(platform) {
        const input = document.getElementById(platform + 'Input');
        const toggle = document.getElementById(platform + 'Toggle');
        const value = input.value.trim();

        if (!value) return alert("Digite o canal/ID!");

        let existing = document.getElementById(platform + 'Wrapper');

        if (toggle.checked) {
            if (!existing) {
                const wrapper = document.createElement('div');
                wrapper.className = "chat-wrapper";
                wrapper.id = platform + 'Wrapper';

                const header = document.createElement('div');
                header.className = "chat-header";
                header.innerHTML = `${icons[platform]} <span>${platform.toUpperCase()} - ${value}</span>`;

                const chatDiv = document.createElement('div');
                chatDiv.id = platform + 'Chat';
                chatDiv.className = "chat-messages";

                // cria iframe
                const iframe = document.createElement('iframe');
                iframe.id = platform + 'Chat';
                iframe.setAttribute('frameborder', '0');

                if (platform === 'twitch') {
                    connectTwitchChat(value, chatDiv.id);
                }

                if (platform === 'kick') iframe.src = `https://kick.com/${value}/chat`;

                // if (platform === 'kick') chatDiv.innerHTML = `<iframe src="https://kick.com/${value}/chat" frameborder="0"></iframe>`;

                if (platform === 'youtube') chatDiv.innerHTML = `<iframe src="https://www.youtube.com/live_chat?v=${value}" frameborder="0"></iframe>`;
                
                wrapper.appendChild(header);
                wrapper.appendChild(chatDiv);
                document.getElementById('chatArea').appendChild(wrapper);

            }
        } else {
            if (existing) existing.remove();
        }
    }

    ['twitch', 'kick', 'youtube'].forEach(platform => {
        document.getElementById(platform + 'Toggle').addEventListener('change', () => handleChat(platform));
    });

    // ----------------- Menu -----------------
    const configPanel = document.getElementById('configPanel');
    const togglePanelBtn = document.getElementById('togglePanelBtn');
    let menuOpen = true;

    togglePanelBtn.addEventListener('click', () => {
        configPanel.classList.toggle('show');
        menuOpen = !menuOpen;
        togglePanelBtn.textContent = menuOpen ? '⚙️' : '❌';
        togglePanelBtn.style.transform = configPanel.classList.contains('show') ? 'translateX(-300px)' : 'translateX(0)';
    });

    // ----------------- Donate -----------------
    const donateBtn = document.getElementById('donateBtn');
    const donateModal = document.getElementById('donateModal');
    const closeBtn = document.getElementById('closeBtn');
    const pixQr = document.getElementById('pixQr');
    const pixKeyElement = document.getElementById('pixKey');
    const pixKey = "f91c3c69-0a2e-40cc-89ed-7c452314de7a";

    donateBtn.onclick = () => {
        donateModal.style.display = "flex";
        pixKeyElement.textContent = pixKey;
        pixQr.innerHTML = "";
        new QRCode(pixQr, { text: pixKey, width: 220, height: 220 });
    };

    closeBtn.onclick = () => donateModal.style.display = "none";

    window.onclick = (e) => { if (e.target == donateModal) donateModal.style.display = "none"; };

});