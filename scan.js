let scanner;


function iniciarScanner() {
    console.log("🎥 Iniciando scanner...");

    scanner = new Html5QrcodeScanner('reader', {
        qrbox: { width: 250, height: 250 },
        fps: 20
    });

    scanner.render(onScanSuccess, onScanError);
}


async function onScanSuccess(decodedText) {
    console.log("QR detectado:", decodedText);
    document.getElementById('resultado').innerText = "Buscando pedido...";

    const pedido = await buscarPedidoEnSheets(decodedText);

    if (pedido) {
        const entregado = await pedidoEntregado(decodedText);

        if (entregado) {
            document.getElementById('resultado').innerHTML = `
            ✅ Pedido encontrado:<br>Cliente: ${pedido[1]}<br>Productos: ${pedido[2]}<br>Total: $${pedido[3]}
            <h2>📦 Este pedido ya fue entregado</h2>`;
        } else {
            document.getElementById('resultado').innerHTML = `
            ✅ Pedido encontrado:<br>Cliente: ${pedido[1]}<br>Productos: ${pedido[2]}<br>Total: $${pedido[3]}
            <button onclick="marcarComoCompletado('${decodedText}')">Marcar como completado</button>`;
        }
    } else {
        document.getElementById('resultado').innerText = "❌ Pedido no encontrado.";
    }

    scanner.clear();
    document.getElementById('reader').innerHTML = ``;
}

function onScanError(err) {
    // console.warn("Error de escaneo:", err);
}

// ✅ Autenticación o restauración automática con localStorage
window.addEventListener('load', () => {
    // Esperar a que gapi esté inicializado antes de cualquier cosa
    const interval = setInterval(() => {
        if (gapiInited) {
            clearInterval(interval);

            const token = gapi.client.getToken();
            if (token) {
                console.log("✅ Token ya activo en scan.js");
                iniciarScanner();
            } else {
                console.log("🔐 Token no encontrado, pidiendo autenticación...");

                handleAuthClick(() => {
                    const nuevoToken = gapi.client.getToken();
                    if (nuevoToken) {
                        localStorage.setItem('token', JSON.stringify(nuevoToken));
                        localStorage.setItem('autenticado', 'true');
                    }
                });
            }
        }
    }, 100); // chequear cada 100ms hasta que gapi esté listo
});

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


async function pedidoEntregado(idPedido) {
    try {
        // 1. Leer toda la columna A (ID pedidos)
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: 'Pedidos!A2:A1000'
        });

        const filas = response.result.values;
        if (!filas || filas.length === 0) {
            alert("⚠️ No hay pedidos en la hoja.");
            return;
        }

        // 2. Buscar el índice del pedido
        const filaIndex = filas.findIndex(fila => String(fila[0]).trim() === String(idPedido).trim());
        if (filaIndex === -1) {
            alert("❌ Pedido no encontrado.");
            return;
        }

        const filaReal = filaIndex + 2; // Ajustar por el encabezado

        // 3. Leer el contenido de la columna E (estado)
        const estadoResp = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: `Pedidos!E${filaReal}`
        });

        const estadoActual = estadoResp.result.values?.[0]?.[0] || '';

        
        if (estadoActual.trim().toLowerCase() === 'entregado') {
            return true;
        }
        else{

            return false

        }


    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al procesar el pedido.");
    }
}

async function marcarComoCompletado(idPedido) {
    try {
        // 1. Leer toda la columna A (ID pedidos)
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: 'Pedidos!A2:A1000'
        });

        const filas = response.result.values;
        if (!filas || filas.length === 0) {
            alert("⚠️ No hay pedidos en la hoja.");
            return;
        }

        // 2. Buscar el índice del pedido
        const filaIndex = filas.findIndex(fila => String(fila[0]).trim() === String(idPedido).trim());
        if (filaIndex === -1) {
            alert("❌ Pedido no encontrado.");
            return;
        }

        const filaReal = filaIndex + 2; // Ajustar por el encabezado

        // 3. Leer el contenido de la columna E (estado)
        const estadoResp = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: `Pedidos!E${filaReal}`
        });

        const estadoActual = estadoResp.result.values?.[0]?.[0] || '';

        if (estadoActual.trim().toLowerCase() === 'entregado') {
            alert("📦 Este pedido ya fue entregado.");
            return;
        }

        // 4. Si está vacío, lo marcamos como entregado
        const valores = {
            values: [["Entregado"]]
        };

        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: `Pedidos!E${filaReal}`,
            valueInputOption: "RAW",
            resource: valores
        });

        alert("✅ Pedido marcado como entregado.");

    } catch (error) {
        console.error("Error al marcar como entregado:", error);
        alert("❌ Error al procesar el pedido.");
    }
}




// Busca el pedido en Google Sheets por ID
function buscarPedidoEnSheets(idPedido) {
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
        range: 'Pedidos!A2:D1000'
    }).then(response => {
        const filas = response.result.values;
        const fila = filas.find(f => f[0] === idPedido);
        return fila || null;
    }).catch(error => {
        console.error("Error buscando en Sheets:", error);
        return null;
    });
}

async function editarCampo(content, fila, columna){

    let response;
    try {
      response = await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
        range: `Pedidos!${columna}${fila}:${columna}${fila}`,
        values: content

      });
    } catch (err) {
      console.error(err)
      return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
          console.warn("No hay valores")
      return;
    }
    // const output = range.values.reduce(
    //     (str, row) => `${str}${row[0]}, ${row[4]}\n`);
    // document.getElementById('content').innerText = content;


}


  async function leerCampo(fila, columna) {
    let response;
    try {
      response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
        range: `Pedidos!${columna}${fila}:${columna}${fila}`,
      });
    } catch (err) {
      console.error(err)
      return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
          console.warn("No hay valores")
      return;
    }
    // Flatten to string to display
    const output = range.values.reduce(
        (str, row) => `${str}${row[0]}\n ${row[4]}\n`);
    
    return output
  
  }

  