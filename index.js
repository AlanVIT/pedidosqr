// Asegurar autenticación antes de guardar el pedido
function iniciarGoogleAuth(callback) {
    if (typeof google === 'undefined') {
        console.error('Google API no cargada');
        return;
    }
    
    google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error('Error en la autenticación:', response.error);
                return;
            }
            console.log('Autenticado con éxito');
            callback();
        },
    }).requestAccessToken({ prompt: 'consent' });
}

// Guardar datos en Google Sheets
function guardarPedidoEnSheets(pedido) {
    const params = {
        spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',  // Reemplaza con tu ID de Sheets
        range: 'Pedidos!A:D',  // Cambia el rango si es necesario
        valueInputOption: 'RAW',
        resource: {
            values: [[pedido.id, pedido.cliente, pedido.productos, pedido.total]]
        }
    };
    
    gapi.client.sheets.spreadsheets.values.append(params).then((response) => {
        console.log('Pedido guardado:', response);
    }, (error) => {
        console.error('Error al guardar pedido:', error);
    });
}

// Función para generar el código QR utilizando la librería QRCode.js
function generarQRCode(contenido) {
    const qrCodeContainer = document.getElementById("qrCode");
    qrCodeContainer.innerHTML = "";  // Limpiar el contenedor antes de generar un nuevo QR

    new QRCode(qrCodeContainer, {
        text: contenido,  // Contenido del QR
        width: 200,  // Ancho del QR
        height: 200  // Altura del QR
    });
}

// Evitar que el formulario haga refresh y enviar datos a Google Sheets
document.getElementById("pedidoForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const pedido = {
        id: document.getElementById("idPedido").value.trim(),
        cliente: document.getElementById("cliente").value.trim(),
        productos: document.getElementById("productos").value.trim(),
        total: document.getElementById("total").value.trim()
    };

    if (!pedido.id) {
        alert("⚠️ Ingresa un ID de pedido válido.");
        return;
    }

    // Paso 1: autenticar antes de interactuar con Sheets
    handleAuthClick(async () => {
        const yaExiste = await existePedido(pedido.id);
        if (yaExiste) {
            alert("⚠️ Ya existe un pedido con ese ID, este es su qr.");
            generarQRCode(pedido.id);
            return;
        }
        
        // Paso 2: generar el QR y guardar
        generarQRCode(pedido.id);
        guardarPedidoEnSheets(pedido);
    });
});



// Función para manejar el escaneo del QR
function onScanSuccess(decodedText) {
    document.getElementById("resultado").innerText = "Pedido verificado: " + decodedText;
}

async function existePedido(idPedido) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
            range: 'Pedidos!A2:A1000'
        });

        const filas = response.result.values || [];
        return filas.some(fila => String(fila[0]).trim() === String(idPedido).trim());

    } catch (error) {
        console.error("Error verificando existencia del pedido:", error);
        return false;  // Por precaución, dejamos seguir si falla
    }
}
