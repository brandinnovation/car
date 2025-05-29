// ---- CONFIGURATION ----
const LIFF_ID_PROFILE = "2007499630-r04RVeeV"; // <--- ใส่ LIFF ID สำหรับหน้าข้อมูลส่วนตัวของคุณ
const GAS_APP_URL = "https://script.google.com/macros/s/AKfycbwpGmRjW6FmWmcisJdrFwlLixylX3ery63_psrhaEEm8SuGIR7fLc6tVk6QyLjBGCxOKQ/exec"; // <--- ใส่ URL ของ Google Apps Script Web App ของคุณ
// ---- END CONFIGURATION ----

document.addEventListener('DOMContentLoaded', () => {
    initializeLiffAndLoadData();
});

async function initializeLiffAndLoadData() {
    document.getElementById('loading').style.display = 'block';
    try {
        await liff.init({ liffId: LIFF_ID_PROFILE });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const profile = await liff.getProfile();
        document.getElementById('lineDisplayName').textContent = profile.displayName;
        await fetchUserCarData(profile.userId);

    } catch (error) {
        console.error('LIFF Initialization or Data Fetch failed', error);
        document.getElementById('message').textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message;
        document.getElementById('message').className = 'error';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

async function fetchUserCarData(userId) {
    if (!userId) {
        document.getElementById('message').textContent = 'ไม่พบ User ID';
        document.getElementById('message').className = 'error';
        return;
    }

    try {
        // Construct URL for GET request
        const url = new URL(GAS_APP_URL);
        url.searchParams.append('lineUserId', userId);
        // url.searchParams.append('action', 'getUserData'); // Optional: if your GAS doGet handles multiple actions

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            displayCarData(result.data);
        } else if (result.status === 'success' && result.data.length === 0) {
             document.getElementById('carListContainer').innerHTML = '<p>คุณยังไม่มีข้อมูลรถที่ลงทะเบียนไว้</p>';
        }
        else {
            throw new Error(result.message || 'ไม่สามารถดึงข้อมูลรถได้');
        }
    } catch (error) {
        console.error('Fetch car data error:', error);
        document.getElementById('message').textContent = `ผิดพลาด: ${error.message}`;
        document.getElementById('message').className = 'error';
    }
}

function displayCarData(carRecords) {
    const container = document.getElementById('carListContainer');
    container.innerHTML = ''; // Clear previous data

    if (carRecords.length === 0) {
        container.innerHTML = '<p>คุณยังไม่มีข้อมูลรถที่ลงทะเบียนไว้</p>';
        return;
    }

    carRecords.forEach(record => {
        const card = document.createElement('div');
        card.className = 'car-info-card';

        // Format warranty date if it's a Date object or string
        let formattedWarrantyDate = record.warrantyDate;
        if (record.warrantyDate) {
            try {
                const dateObj = new Date(record.warrantyDate);
                 // Check if date is valid
                if (!isNaN(dateObj.getTime())) {
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    formattedWarrantyDate = `${day}/${month}/${year}`;
                } else {
                     // if it's already in dd/mm/yyyy string format from sheet
                    formattedWarrantyDate = record.warrantyDate.split('T')[0].split('-').reverse().join('/');
                }
            } catch (e) {
                // If parsing fails, use original value (could be already dd/mm/yyyy string)
                formattedWarrantyDate = record.warrantyDate;
            }
        }


        card.innerHTML = `
            <p><strong>ชื่อ-สกุล:</strong> ${record.fullName || 'N/A'}</p>
            <p><strong>เบอร์โทร:</strong> ${record.phoneNumber || 'N/A'}</p>
            <p><strong>เลขทะเบียนรถ:</strong> ${record.licensePlate || 'N/A'}</p>
            <p><strong>วันที่ลงทะเบียนรับประกัน:</strong> ${formattedWarrantyDate || 'N/A'}</p>
        `;
        container.appendChild(card);
    });
}
