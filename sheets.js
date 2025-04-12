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

async function editarPedido(content, fila){

  const update = [
    content.id,
    content.products,
    content.total
  ]

  let rangoEditar = leerCampo(1, "F")
  editarCampo(parseInt(rangoEditar) + 1, 1, "F")

  let response;
  try {
    response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
      range: `Pedidos!"A"${rangoEditar}:"D"${rangoEditar}`,
      content: update
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


async function leerPedido(fila) {
  let response;
  try {
    // Fetch first 10 files
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '14PiA80nAr4a9EkFLq8dz3yp1XMZJBWHVDABc1ylMi1Q',
      range: `Pedidos!A${fila}:D${fila}`,
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

async function leerCampo(fila, columna) {
  let response;
  try {
    // Fetch first 10 files
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