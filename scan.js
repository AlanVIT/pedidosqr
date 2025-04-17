const urlParams = new URLSearchParams(window.location.search);
const idPedidoURL = urlParams.get('id');
let scanner;

let gapiReady = new Promise((resolve) => {
    window.addEventListener('load', () => {
        gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });
            console.log("✅ GAPI inicializado en scan.js");
            resolve();
        });
    });
});

function iniciarScanner() {
    console.log("🎥 Iniciando scanner...");

    scanner = new Html5QrcodeScanner('reader', {
        qrbox: { width: 250, height: 250 },
        fps: 20
    });

    scanner.render(onScanSuccess, onScanError);
}

async function buscarPedidoEnSheets(idPedido) {
    await gapiReady;

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: 'Pedidos!A2:D1000'
        });

        const filas = response.result.values;
        const fila = filas.find(f => f[0] === idPedido);
        return fila || null;
    } catch (error) {
        console.error("Error buscando en Sheets:", error);
        return null;
    }
}

async function pedidoEntregado(idPedido) {
    await gapiReady;

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: 'Pedidos!A2:A1000'
        });

        const filas = response.result.values || [];
        const filaIndex = filas.findIndex(fila => String(fila[0]).trim() === String(idPedido).trim());

        if (filaIndex === -1) return false;

        const filaReal = filaIndex + 2;

        const estadoResp = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: `Pedidos!E${filaReal}`
        });

        const estadoActual = estadoResp.result.values?.[0]?.[0] || '';
        return estadoActual.trim().toLowerCase() === 'entregado';
    } catch (error) {
        console.error("Error verificando estado:", error);
        return false;
    }
}

async function procesarPedido(idPedido) {
    const pedido = await buscarPedidoEnSheets(idPedido);

    if (pedido) {
        const entregado = await pedidoEntregado(idPedido);

        if (entregado) {
            document.getElementById('resultado').innerHTML = `
                ✅ Pedido encontrado:<br>Cliente: ${pedido[1]}<br>Productos: ${pedido[2]}<br>Total: $${pedido[3]}
                <h2>📦 Este pedido ya fue entregado</h2>`;
        } else {
            document.getElementById('resultado').innerHTML = `
                ✅ Pedido encontrado:<br>Cliente: ${pedido[1]}<br>Productos: ${pedido[2]}<br>Total: $${pedido[3]}
                <button onclick="marcarComoCompletado('${idPedido}')">Marcar como completado</button>`;
        }
    } else {
        document.getElementById('resultado').innerText = "❌ Pedido no encontrado.";
    }
}

async function onScanSuccess(decodedText) {
    console.log("QR detectado:", decodedText);
    scanner.clear();
    document.getElementById('reader').innerHTML = "";
    await procesarPedido(decodedText);
}

function onScanError(err) {
    console.warn("Error de escaneo:", err);
}

// Detectar si llegó ID por URL
window.addEventListener('load', async () => {
    await gapiReady;

    if (idPedidoURL) {
        console.log("🔎 ID detectado en URL:", idPedidoURL);
        await procesarPedido(idPedidoURL);
    } else {
        console.log("📷 No hay ID en URL, iniciando escáner");
        iniciarScanner();
    }
});
