// ==========================================================
// URL API GOOGLE APPS SCRIPT ANDA
// ==========================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyZkXtXM6BVJQZwjZyxcPl27FCxgzT26ZE3m9ABs_tOGWkHzYPl0EINXABpBEk86M5_FA/exec";

const formIdMap = {
  'Absensi': 'formAbsensi',
  'Absensi_Backup': 'formAbsensiBackup',
  'Barang_Datang': 'formBarang',
  'Pendistribusian': 'formDistribusi',
  'Data_Sampah': 'formSampah'
};

function openForm(formId) {
  document.getElementById('dashboard-view').classList.add('hidden');
  document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
  document.getElementById(formId).classList.add('active');
  document.getElementById('msgBox').style.display = 'none';
}

function backToDashboard() {
  document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
  document.getElementById('dashboard-view').classList.remove('hidden');
  document.getElementById('msgBox').style.display = 'none';
}

function backToDashboardFromSuccess() {
  document.getElementById('success-view').classList.remove('active');
  document.getElementById('dashboard-view').classList.remove('hidden');
  muatDataDashboard(); 
}

function showMessage(text, isSuccess) {
  const msgBox = document.getElementById('msgBox');
  msgBox.innerText = text;
  msgBox.className = 'message ' + (isSuccess ? 'success' : 'error');
  msgBox.style.display = 'block';
}

// FUNGSI TARIK DATA DENGAN FETCH API
function muatDataDashboard() {
  // Mengisi Tanggal Operasional Hari Ini
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('valTanggal').innerText = date.toLocaleDateString('id-ID', options);
  
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "getDashboardData" })
  })
  .then(response => response.json())
  .then(data => {
    if (!data || data.error) return;
    document.getElementById('valPorsi').innerText = data.totalPorsi || 0;
    
    let listHTML = "";
    let totalSekolahAktif = 0;
    
    if (data.sekolah && data.sekolah.length > 0) {
      data.sekolah.forEach(function(row) {
        if (row[0]) { 
          totalSekolahAktif++;
          listHTML += `
            <div class="school-item">
              <div class="school-info"><h4>${row[0]}</h4><p>⏱ Jadwal: ${row[1] || '-'}</p></div>
              <div class="school-portion">${row[2] || 0} Porsi</div>
            </div>`;
        }
      });
    }
    
    if (listHTML === "") listHTML = "<div style='text-align:center; color:#64748b; padding:20px;'>Belum ada jadwal</div>";
    document.getElementById('schoolListContainer').innerHTML = listHTML;
    document.getElementById('valSekolah').innerText = totalSekolahAktif + " Titik";

    // Menyuntikkan nama relawan otomatis ke Datalist
    if (data.namaRelawan && data.namaRelawan.length > 0) {
      let namaHTML = "";
      data.namaRelawan.forEach(function(nama) {
        namaHTML += `<option value="${nama}">`;
      });
      document.getElementById('databaseNama').innerHTML = namaHTML;
    }
  })
  .catch(err => {
    console.error("Gagal memuat data dari server", err);
  });
}

window.onload = function() { muatDataDashboard(); };

function compressAndUpload(file, callback) {  
      const reader = new FileReader();  
      reader.onload = function(e) {  
        const img = new Image();  
        img.onload = function() {  
          const canvas = document.createElement('canvas');  
          const MAX_WIDTH = 800; const MAX_HEIGHT = 800; // Kompresi ringan anti gagal
          let width = img.width; let height = img.height;  
  
          if (width > height) {  
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }  
          } else {  
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }  
          }  
          canvas.width = width; canvas.height = height;  
          const ctx = canvas.getContext('2d');  
          
          // 1. Menggambar foto asli dari kamera ke dalam Canvas
          ctx.drawImage(img, 0, 0, width, height);  
          
          // ==========================================
          // 2. FITUR BARU: MENCETAK TIMESTAMP DI ATAS FOTO
          // ==========================================
          const waktuSekarang = new Date();
          const teksWaktu = waktuSekarang.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
          
          // Desain Teks: Ukuran 30px, warna Kuning dengan pinggiran (outline) Hitam 
          // agar teks selalu terbaca meski background fotonya gelap/terang
          ctx.font = "bold 30px Arial";
          ctx.fillStyle = "yellow";
          ctx.strokeStyle = "black";
          ctx.lineWidth = 4;a
          
          // Menulis teks di pojok kiri bawah (X: 20, Y: tinggi gambar - 30)
          ctx.strokeText("Waktu: " + teksWaktu, 20, height - 30);
          ctx.fillText("Waktu: " + teksWaktu, 20, height - 30);
          // ==========================================
            
          // 3. Simpan dan kirim ke server (Kualitas 50% super cepat)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);  
          callback(dataUrl);  
        }  
        img.onerror = function() { callback(e.target.result); }   
        img.src = e.target.result;  
      }  
      reader.readAsDataURL(file);  
    }

// FUNGSI PENGIRIMAN DATA DENGAN FETCH API
function handleFormSubmit(event, type) {
  event.preventDefault(); 
  const btn = document.getElementById('btn-' + type);
  const loading = document.getElementById('loadingText');
    
  btn.disabled = true; loading.style.display = 'block'; document.getElementById('msgBox').style.display = 'none';
  let formData = {}; let fileInput = null;
    
  try {
    if (type === 'Absensi') {
      formData = { 
        nama: document.getElementById('namaRelawan').value, 
        status: document.querySelector('input[name="statusAbsen"]:checked').value, 
        divisi: document.querySelector('input[name="divisiRelawan"]:checked').value 
      };
      fileInput = document.getElementById('fotoAbsen');
    } else if (type === 'Absensi_Backup') {
      formData = { 
        nama: document.getElementById('namaRelawan_Backup').value, 
        status: document.querySelector('input[name="statusAbsen_Backup"]:checked').value, 
        divisi: document.querySelector('input[name="divisiRelawan_Backup"]:checked').value 
      };
      fileInput = document.getElementById('fotoAbsen_Backup');
    } else if (type === 'Barang_Datang') {
      formData = { namaBarang: document.getElementById('namaBarang').value, jumlah: document.getElementById('jumlahBarang').value, satuan: document.getElementById('satuanBarang').value, keterangan: document.getElementById('ketBarang').value };
      fileInput = document.getElementById('fotoBarang');
    } else if (type === 'Pendistribusian') {
      formData = { sekolah: document.getElementById('namaSekolah').value, jumlahFoodtray: document.getElementById('jumlahFoodtray').value, kurir: document.getElementById('kurirDistribusi').value };
      fileInput = document.getElementById('fotoDistribusi');
    } else if (type === 'Data_Sampah') {
      formData = { sekolah: document.getElementById('namaSekolahSampah').value, menu: document.getElementById('menuSampah').value, berat: document.getElementById('beratSampah').value };
      fileInput = document.getElementById('fotoSampah');
    }
      
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const fileAsli = fileInput.files[0];
      compressAndUpload(fileAsli, function(base64Data) {
        const fileData = { base64: base64Data, name: fileAsli.name, type: 'image/jpeg' };
          
        // Fetch API untuk kirim data
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "upload",
            formType: type,
            data: formData,
            fileData: fileData
          })
        })
        .then(response => response.json())
        .then(res => {
          btn.disabled = false; loading.style.display = 'none';
          if (res.success) { 
            const targetFormId = formIdMap[type];
            if (targetFormId) { document.getElementById(targetFormId).reset(); }
              
            document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
            document.getElementById('dashboard-view').classList.add('hidden');
              
            document.getElementById('successMessageText').innerText = res.message;
            document.getElementById('success-view').classList.add('active');
          } else { 
            showMessage("Gagal tersimpan: " + res.message, false); 
          }
        })
        .catch(err => {
          btn.disabled = false; loading.style.display = 'none'; 
          showMessage("Gagal koneksi ke server. Sinyal lemah.", false);
        });
      });
    } else {
      btn.disabled = false; loading.style.display = 'none'; showMessage("Foto wajib dilampirkan.", false);
    }
  } catch (err) {
    btn.disabled = false; loading.style.display = 'none'; showMessage("Error sistem: " + err, false);
  }
}
