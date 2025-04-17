window.addEventListener('load', async () => {
    const params = new URLSearchParams(window.location.search);
    const idPedido = params.get('id');

    if (idPedido) {
        console.log("📦 ID encontrado en URL:", idPedido);
        document.getElementById('resultado').innerText = "Buscando pedido...";

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
    } else {
        console.log("🔎 No hay ID en la URL, mostrar el escáner de QR tradicional...");
        iniciarScanner(); // Si no hay id, usamos el escáner normal
    }
});