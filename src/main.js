(function() {
    'use strict';

    const logPrefix = `[Asfixy Engine]: `;
    function logger(message, type = "log") {
        let style = "color: cyan;";
        switch (type) {
            case "error": style = "color: red; font-weight: bold;"; break;
            case "warn": style = "color: orange;"; break;
            case "success": style = "color: #33ff77; font-weight: bold;"; break;
        }
        console.log(`%c${logPrefix}${message}`, style);
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

    let API_URL = "http://127.0.0.1:3000";

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
            const script = document.createElement("script");
            script.textContent =
                "try{(function(){\n" +
                code +
                "\n})();}catch(e){console.log('%c[Asfixy Engine]: Execution Error: ', 'color:red;font-weight:bold;', e);}";
            document.documentElement.appendChild(script);
            script.remove();
        } catch(e) {
            logger("Payload injection failed: " + e.message, "error");
        }
    }
})();