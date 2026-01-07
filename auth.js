// auth.js
// Sistem Login Admin - Permohonan Alat Tulis

const validUsers = {
  "admin_alattulis": "uhsb2025",
  "pegawai": "alat123",
  "supervisor": "12345"
};

function login() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const errorBox = document.getElementById('errorBox');

  // reset error
  errorBox.style.display = 'none';

  // validasi login
  if (validUsers[user] && validUsers[user] === pass) {

    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('role', user);
    sessionStorage.setItem('loginTime', new Date().toLocaleString());

    // redirect ke admin alat tulis
    window.location.href = "admin.html";

  } else {
    errorBox.style.display = 'block';
    errorBox.innerText = "Nama pengguna atau kata laluan tidak sah.";
  }
}

// fungsi logout (digunakan di admin.html)
function logout() {
  if (confirm("Adakah anda pasti untuk log keluar?")) {
    sessionStorage.clear();
    window.location.href = "adminlogin.html";
  }
}
