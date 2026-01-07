/********************************
 * MAIN ENDPOINT
 ********************************/
function doGet(e) {
  try {
    const action = e.parameter.action || "getResponse";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {

      // ===============================
      // SESSION_API → Jadual Alatan
      // ===============================
      case "getSession": {
        const sheet = ss.getSheetByName("Jadual");
        return sendSheetJSON(sheet);
      }

      // ===============================
      // NAMES_API → Senarai Nama
      // ===============================
      case "getNames": {
        const sheet = ss.getSheetByName("Senarai Nama");
        const search = (e.parameter.search || "").toLowerCase();

        const data = sheet.getDataRange().getValues();
        const headers = data.shift();

        let result = data.map(r => {
          let o = {};
          headers.forEach((h, i) => o[h] = r[i]);
          return o;
        });

        if (search) {
          result = result.filter(r =>
            r.Nama.toLowerCase().includes(search)
          ).slice(0, 10);
        }

        return sendJSON(result);
      }

      // ===============================
      // CHECK DUPLICATE
      // ===============================
      case "checkDuplicate": {
        const nama  = e.parameter.nama;
        const jenis = e.parameter.jenis;

        const sheet = ss.getSheetByName("Response");
        const data = sheet.getDataRange().getValues();
        const headers = data.shift();

        const exists = data.some(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj.Nama === nama && obj["Jenis Alatan"] === jenis;
        });

        return sendJSON({ exists });
      }

      // ===============================
      // RESPONSE_API → Rekod Permohonan
      // ===============================
      default: {
        const sheet = ss.getSheetByName("Response");
        return sendSheetJSON(sheet);
      }
    }

  } catch (err) {
    return sendJSON({ status: "error", message: err.toString() });
  }
}

/********************************
 * POST PERMOHONAN
 ********************************/
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Response");

    let data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.Nama || "",
      data.Jabatan || "",
      data.Jenis_Alatan || "",
      data.Kuantiti || "",
      data.Tempoh || "",
      new Date()
    ]);

    return sendJSON({
      status: "success",
      message: "Permohonan berjaya direkodkan"
    });

  } catch (err) {
    return sendJSON({
      status: "error",
      message: err.toString()
    });
  }
}

/********************************
 * HELPERS
 ********************************/
function sendSheetJSON(sheet) {
  if (!sheet) throw new Error("Sheet tidak dijumpai");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const result = data.map(r => {
    let o = {};
    headers.forEach((h, i) => o[h] = r[i]);
    return o;
  });

  return sendJSON(result);
}

function sendJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


const SESSION_API = 'https://script.google.com/macros/s/AKfycbyJb0LRiv0KUxuChux0fhqqCaH7CVecLhKB3LIiJG7sxIN9lbvk6liWI9bdftXmscxy/exec';
const NAMES_API   = 'https://script.google.com/macros/s/AKfycbzhupcaaavOqs_0uchTtwdy9KD0cjomkObNUJc5-b90ZqL5inJxZKKJ8FeiBWj_KEl75g/exec';
const CHECK_API   = 'https://script.google.com/macros/s/AKfycbxF84-oQDWF74LzA7wihPPZbt5sSjSkrv3TjY14vl4PFCYiq7OIcgzqX--2_l4EFswD/exec';
const RESPOND     = 'https://script.google.com/macros/s/AKfycbxuQlHdFjmTlDJFXVQYDPw7cLB8VoxBc48z6beIxQGFsK95CycxrAhTHj9xgiw5T0JW/exec';
