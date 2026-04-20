let lastUpdate = 0;

// pegar key da URL ou storage
const params = new URLSearchParams(window.location.search);
let key = params.get("asfixy_key");

if (key) {
    localStorage.setItem("asfixy_key", key);
    console.log("[ASFIXY] Key:", key);
} else {
    key = localStorage.getItem("asfixy_key");
}

// loop engine
setInterval(async () => {
    try {
        if (!key) {
            console.log("[ASFIXY] No Key Found. Please provide ?asfixy_key");
            return;
        }

        const res = await fetch("http://127.0.0.1:3000/engine/pull", {
            headers: {
                "x-asfixy-key": key
            }
        });

        const data = await res.json();

        if (!data.code) return;
        if (data.updatedAt === lastUpdate) return;

        lastUpdate = data.updatedAt;

        console.log("[ASFIXY] Executando código...");
        inject(data.code);

    } catch (e) {
        console.log("[ASFIXY] engine error", e);
    }
}, 1500);

// injector REAL
function inject(code){
    try{
        const script = document.createElement("script");

        script.textContent =
            "try{(function(){\n" +
            code +
            "\n})();}catch(e){console.log('[ASFIXY EXEC ERROR]', e);}";

        document.documentElement.appendChild(script);
        script.remove();
    }catch(e){
        console.log("[ASFIXY] inject fail", e);
    }
}