// ต้องเปลี่ยนเป็น Web App URL ของ Google Apps Script ที่คุณได้จากขั้นตอนที่ 1.3
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBL7Sp11EUevexL_p_o_ZWFFNMLYU2mwo80l0YizSTd9ioCc8I5MAq1FD14ULMxQ4WhQ/exec'; 

document.addEventListener('DOMContentLoaded', function() {
    const carListDiv = document.getElementById('carList');
    const closeWindowBtn = document.getElementById('closeWindowBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    liff.init({
        liffId: '2007499630-r04RVeeV' // เปลี่ยนเป็น LIFF ID ของคุณสำหรับหน้าดูข้อมูล
    }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            fetchCarData();
        }
    }).catch(err => {
        console.error('LIFF initialization failed:', err);
        carListDiv.innerHTML = '<p style="color:red; text-align:center;">LIFF initialization failed: ' + err.message + '</p>';
    });

    async function fetchCarData() {
        loadingOverlay.style.display = 'flex'; // Show loading overlay
        try {
            const profile = await liff.getProfile();
            const lineUserId = profile.userId;

            const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?lineUserId=${lineUserId}`, {
                method: 'GET',
                mode: 'cors'
            });

            const result = await response.json();
            loadingOverlay.style.display = 'none'; // Hide loading overlay

            if (result.status === 'success' && result.data.length > 0) {
                carListDiv.innerHTML = ''; // Clear loading message
                result.data.forEach(car => {
                    const carCard = document.createElement('div');
                    carCard.classList.add('car-card');
                    carCard.innerHTML = `
                        <p><strong>ชื่อ-สกุล:</strong> ${car['ชื่อ สกุล']}</p>
                        <p><strong>เบอร์โทร:</strong> ${car['เบอร์โทร']}</p>
                        <p><strong>เลขทะเบียนรถ:</strong> ${car['เลขทะเบียนรถ']}</p>
                        <p><strong>วันลงทะเบียน:</strong> ${car['วันที่ลงทะเบียนรับประกัน']}</p>
                    `;
                    carListDiv.appendChild(carCard);
                });
            } else if (result.status === 'success' && result.data.length === 0) {
                carListDiv.innerHTML = '<p style="text-align: center; color: #FFF;">ไม่พบข้อมูลรถยนต์ของคุณ กรุณาลงทะเบียนก่อน</p>';
            } else {
                carListDiv.innerHTML = '<p style="color:red; text-align:center;">เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (result.message || 'Unknown error') + '</p>';
            }
        } catch (error) {
            loadingOverlay.style.display = 'none'; // Hide loading overlay
            console.error('Error fetching car data:', error);
            carListDiv.innerHTML = '<p style="color:red; text-align:center;">เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message + '</p>';
        }
    }

    closeWindowBtn.addEventListener('click', function() {
        if (liff.isInClient()) {
            liff.closeWindow();
        } else {
            alert('คุณสามารถปิดหน้านี้ได้เลย');
        }
    });
});
