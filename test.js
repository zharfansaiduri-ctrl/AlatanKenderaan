/******************************
 * CONFIG
 ******************************/
const CACHE_DURATION = 5 * 60 * 1000; // 5 min cache

const SESSION_API = BASE_URL + "?action=getSession";
const NAMES_API   = BASE_URL + "?action=getNames";
const CHECK_API   = BASE_URL + "?action=checkDuplicate";
const SUBMIT_API  = RESPOND;

/******************************
 * CACHE HELPERS
 ******************************/
function getCachedData(key) {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}_time`);

    if (cached && timestamp && (Date.now() - parseInt(timestamp) < CACHE_DURATION)) {
        return JSON.parse(cached);
    }
    return null;
}

function setCachedData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_time`, Date.now().toString());
}

/******************************
 * LOAD SESSION / SETTING DATA
 ******************************/
let sessionData = {};

async function loadSessionData() {
    try {
        const cached = getCachedData('sessionData');
        if (cached) {
            sessionData = cached;
            initializeForm();
            return;
        }

        const response = await fetch(SESSION_API);
        if (!response.ok) throw new Error("Gagal load session");

        const data = await response.json();
        sessionData = data;

        setCachedData('sessionData', data);
        initializeForm();

    } catch (err) {
        console.error(err);
        showError("Ralat memuatkan data sistem.");
    }
}

/******************************
 * AUTOCOMPLETE NAMA STAF
 ******************************/
let isCustomName = false;

async function setupNameAutocomplete() {
    const namaInput = document.getElementById('nama');
    const dropdown  = document.getElementById('nameDropdown');
    let debounceTimer;

    namaInput.addEventListener('input', () => {
        const term = namaInput.value.trim();
        clearTimeout(debounceTimer);

        if (term.length < 2) {
            dropdown.classList.remove('show');
            return;
        }

        debounceTimer = setTimeout(() => searchNames(term), 300);
    });

    async function searchNames(term) {
        try {
            const cacheKey = `names_${term.toLowerCase()}`;
            let result = getCachedData(cacheKey);

            if (!result) {
                const res = await fetch(`${NAMES_API}&search=${encodeURIComponent(term)}`);
                result = await res.json();
                setCachedData(cacheKey, result);
            }

            renderDropdown(result);
        } catch (err) {
            console.error("Search error:", err);
        }
    }

    function renderDropdown(list) {
        if (!list.length) {
            dropdown.innerHTML = `<div class="add-new">✓ Nama baru</div>`;
            dropdown.classList.add('show');
            isCustomName = true;
            return;
        }

        dropdown.innerHTML = list.map(item => `
            <div class="name-option" data-name="${item.Nama}" data-jabatan="${item.Jabatan}">
                ${item.Nama} <span>(${item.Jabatan})</span>
            </div>
        `).join('');

        dropdown.classList.add('show');
        isCustomName = false;

        document.querySelectorAll('.name-option').forEach(opt => {
            opt.onclick = () => {
                namaInput.value = opt.dataset.name;
                document.getElementById('jabatan').value = opt.dataset.jabatan;
                dropdown.classList.remove('show');
            };
        });
    }
}

/******************************
 * DUPLICATE CHECK
 ******************************/
async function checkDuplicate(nama, jenis) {
    try {
        const res = await fetch(
            `${CHECK_API}&nama=${encodeURIComponent(nama)}&jenis=${encodeURIComponent(jenis)}`
        );
        const data = await res.json();
        return data.exists ? data : null;
    } catch (err) {
        console.error("Duplicate check error", err);
        return null;
    }
}

/******************************
 * FORM SUBMIT
 ******************************/
document.getElementById('formPermohonan').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerHTML;

    const nama     = document.getElementById('nama').value.trim();
    const jabatan  = document.getElementById('jabatan').value.trim();
    const jenis    = document.getElementById('jenis').value;
    const kuantiti = document.getElementById('kuantiti').value;
    const tempoh   = document.getElementById('tempoh').value;

    btn.disabled = true;
    btn.innerHTML = "Memeriksa...";

    const duplicate = await checkDuplicate(nama, jenis);
    if (duplicate) {
        showMessage(`⚠️ Permohonan ${jenis} oleh ${nama} sudah wujud!`, "warning");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    btn.innerHTML = "Menghantar...";

    try {
        const response = await fetch(SUBMIT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Nama: nama,
                Jabatan: jabatan,
                Jenis_Alatan: jenis,
                Kuantiti: kuantiti,
                Tempoh: tempoh
            })
        });

        const result = await response.json();

        if (result.status === "success") {
            showMessage("✅ Permohonan berjaya dihantar", "success");
            document.getElementById('formPermohonan').reset();
        } else {
            throw new Error(result.message);
        }

    } catch (err) {
        console.error(err);
        showMessage("❌ Ralat menghantar permohonan", "error");
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
});

/******************************
 * UTIL
 ******************************/
function showMessage(msg, type) {
    alert(msg); // boleh tukar ke toast UI
}

function showError(msg) {
    alert(msg);
}

/******************************
 * INIT
 ******************************/
document.addEventListener('DOMContentLoaded', () => {
    loadSessionData();
    setupNameAutocomplete();
});
