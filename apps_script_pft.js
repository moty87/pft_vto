/**
 * APPS SCRIPT — PFT Frescos · Maxi 59
 * 
 * SETUP:
 * 1. Crear un Google Sheet NUEVO (distinto al de PGC)
 * 2. Pegar este código en Extensiones > Apps Script > Code.gs
 * 3. Crear hoja "CatalogoFrescos" e importar catalogo_frescos.csv
 *    (Archivo > Importar > destildar "Convertir texto en números")
 * 4. Implementar > Nueva implementación > Aplicación web
 *    Ejecutar como: Yo | Acceso: Cualquier persona
 * 5. Copiar la URL y pegarla en index.html (SHEETS_URL_FRESCOS)
 */

// ── BUSCAR PRODUCTO EN CATÁLOGO FRESCOS ───────────────────────────
function buscarFresco(ean) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const catalogo = ss.getSheetByName('CatalogoFrescos');
  if (!ean || !catalogo) return null;

  const data   = catalogo.getDataRange().getValues();
  const eanStr = String(ean).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === eanStr) {
      return {
        nombre:      String(data[i][1]).trim(),  // Descripcion
        seccion:     String(data[i][2]).trim(),  // Seccion (label)
        seccionForm: String(data[i][3]).trim(),  // SeccionForm (valor del form Carrefour)
      };
    }
  }
  return null;
}

// ── GUARDAR LOTE DE FRESCOS ───────────────────────────────────────
function guardarFrescos(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName('Frescos');

  if (!hoja) {
    hoja = ss.insertSheet('Frescos');
    const h = [
      'Fecha carga','EAN','Producto','Sección',
      'Fecha venc','Días','Stock',
      'Precio actual','Precio sugerido','Form enviado'
    ];
    hoja.appendRow(h);
    hoja.getRange(1,1,1,h.length)
        .setFontWeight('bold')
        .setBackground('#0a2a1a')
        .setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 160);
    hoja.setColumnWidth(3, 260);
    hoja.setColumnWidth(4, 180);
  }

  try {
    const items = JSON.parse(p.data || '[]');
    items.forEach(item => {
      hoja.appendRow([
        item.fecha_carga || new Date().toLocaleString('es-AR'),
        item.ean         || '',
        item.nombre      || '',
        item.seccion     || '',
        item.fecha_venc  || '',
        item.dias        || '',
        item.stock       || '',
        item.precio_actual || '',
        item.precio_sug    || '',
        'No',
      ]);
    });
    return { ok: true, cantidad: items.length };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

// ── doGet: router principal ───────────────────────────────────────
function doGet(e) {
  const p      = e.parameter;
  const accion = p.accion || '';

  // Guardar lote de frescos
  if (accion === 'frescos') {
    const r = guardarFrescos(p);
    return ContentService
      .createTextOutput(JSON.stringify(r))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Buscar producto por EAN
  const ean = (p.ean || '').trim();
  if (ean) {
    const fresco = buscarFresco(ean);
    if (fresco) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok:          true,
          ean,
          nombre:      fresco.nombre,
          seccion:     fresco.seccion,
          seccionForm: fresco.seccionForm,
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // EAN no encontrado en catálogo frescos
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ean, nombre: null, seccion: null }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: 'Parámetros insuficientes' }))
    .setMimeType(ContentService.MimeType.JSON);
}
