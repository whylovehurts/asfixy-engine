(function() {
    'use strict';

    let API_URL = "http://127.0.0.1:3000";

    const logPrefix = `[Asfixy Engine]: `;
    function logger(message, type = "log") {
        if (!key) return;
        fetch(API_URL + "/log", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-asfixy-key": key },
            body: JSON.stringify({ msg: message, type })
        }).catch(() => {});
    }

    let lastUpdate = 0;
    const params = new URLSearchParams(window.location.search);
    let key = params.get("asfixy_key");

    if (key) {
        localStorage.setItem("asfixy_key", key);
        logger(`Access Key registered from URL.`, "success");
    } else {
        key = localStorage.getItem("asfixy_key");
    }

    (async function init() {
        if (!key) {
            logger("No Key Found. Please provide ?asfixy_key in the URL.", "error");
            return;
        }

        try {
            await fetch(API_URL + "/");
            logger(`Connected to Localhost API!`, "success");
        } catch (e) {
            API_URL = "https://asfixy-api.onrender.com";
            logger(`Localhost failed. Redirecting to default host: ${API_URL}`, "warn");
        }
        
        setInterval(async () => {
            try {
                const res = await fetch(API_URL + "/engine/pull", {
                    headers: { "x-asfixy-key": key }
                });

                const data = await res.json();

                if (!data.code) return;
                if (data.updatedAt === lastUpdate) return;

                lastUpdate = data.updatedAt;

                logger("Executing received code payload...", "success");
                inject(data.code);

            } catch (e) {
                // Silently ignore connection errors during polling to prevent console spam
            }
        }, 1500);
    })();

    function inject(code) {
        try {
            // Cria a função com try-catch embutido para capturar erros sem sujar o console
            const exec = new Function(`
                try {
                    ${code}
                } catch(e) {
                    return e.message;
                }
                return null;
            `);
            
            const errorMsg = exec();
            if (errorMsg) {
                logger("Script Error: " + errorMsg, "error");
            }
        } catch(e) {
            logger("Compilation Error: " + e.message, "error");
        }
    }
})();