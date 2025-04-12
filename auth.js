// Datos para Google API
const CLIENT_ID = '158471919435-9pbmlkeul2shmurosiemhjtne8qg8jeu.apps.googleusercontent.com';  // Tu CLIENT_ID
const API_KEY = 'AIzaSyDR9mpx1LBUct9vsEDrGJZNjPsQ96_T9hY';  // Tu API_KEY
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Estas funciones se llamarán cuando los scripts de Google se carguen correctamente.
window.gapiLoaded = function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
};

window.gisLoaded = function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',  // Definido luego
    });
    gisInited = true;
    maybeEnableButtons();
};

// Cargar el cliente de la API de Google Sheets
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        console.log('Google APIs cargadas y listas');
    }
}


// Autenticación
function handleAuthClick(callback) {
    if (typeof callback !== 'function') {
        callback = () => console.warn('No se proporcionó un callback válido');
    }
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error("Error en la autenticación:", resp);
            return;
        }
    
        const token = gapi.client.getToken();
        if (token) {
            localStorage.setItem('token', JSON.stringify(token));
            localStorage.setItem('autenticado', 'true');
        }
    
        callback();
    };
    
    const token = gapi.client.getToken();
    const yaAutenticado = localStorage.getItem('autenticado') === 'true';

    if (!token && !yaAutenticado) {
        console.log("Solicitando acceso con consentimiento");
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else if (!token && yaAutenticado) {
        console.log("Recuperando token sin consentimiento");
        tokenClient.requestAccessToken({ prompt: '' });
    } else {
        console.log("Ya hay token activo");
        callback();
    }

}

// Cerrar sesión
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('autenticado');
        console.log('Cerraste la sesión');
    }
}

async function listMajors() {
  let response;
  try {
    // Fetch first 10 files
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
      range: 'Pedidos!A1:D4',
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

window.addEventListener('load', () => {
    const tokenGuardado = localStorage.getItem('token');
    const autenticado = localStorage.getItem('autenticado') === 'true';

    if (tokenGuardado && autenticado) {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });

                gapi.client.setToken(JSON.parse(tokenGuardado));
                console.log("✅ Token restaurado correctamente en auth.js");

                // if (typeof iniciarScanner === 'function') {
                //     iniciarScanner();
                // }
            } catch (err) {
                console.error("❌ Error al inicializar gapi.client:", err);
            }
        });
    } else {
        console.warn("⚠️ No hay token guardado, se pedirá autenticación");
        if (typeof iniciarScanner === 'function') {
            iniciarScanner();
        }
    }
});




