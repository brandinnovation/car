// ต้องเปลี่ยนเป็น Web App URL ของ Google Apps Script ที่คุณได้จากขั้นตอนที่ 1.3
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'; 

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const lineUserIdInput = document.getElementById('lineUserId');
    const registrationDateInput = document.getElementById('registrationDate');
    const responseMessageDiv = document.getElementById('responseMessage');
    const closeWindowBtn = document.getElementById('closeWindowBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Set current date automatically
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    registrationDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Initialize LIFF
    liff.init({
        liffId: 'YOUR_LIFF_ID_FOR_REGISTRATION_HERE' // เปลี่ยนเป็น LIFF ID ของคุณสำหรับหน้าลงทะเบียน
    }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            liff.getProfile().then(profile => {
                lineUserIdInput.value = profile.userId;
            }).catch(err => {
                console.error('Error getting profile:', err);
                alert('ไม่สามารถดึงข้อมูล LINE Profile ได้: ' + err.message);
            });
        }
    }).catch(err => {
        console.error('LIFF initialization failed:', err);
        alert('LIFF initialization failed: ' + err.message);
    });

    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        loadingOverlay.style.display = 'flex'; // Show loading overlay

        const formData = {
            lineUserId: lineUserIdInput.value,
            fullName: document.getElementById('fullName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            licensePlate: document.getElementById('licensePlate').value,
            currentDate: registrationDateInput.value // Use the auto-filled date
        };

        try {
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors', // Crucial for cross-origin requests
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            loadingOverlay.style.display = 'none'; // Hide loading overlay

            if (result.status === 'success') {
                registrationForm.style.display = 'none'; // Hide form
                responseMessageDiv.style.display = 'block'; // Show success message

                // Send Flex Message (Line User ID is needed here)
                if (liff.isInClient() && liff.isLoggedIn()) {
                    await liff.sendMessages([
                        {
                            type: 'flex',
                            altText: 'ลงทะเบียนรถยนต์เรียบร้อยแล้ว',
                            contents: {
                                type: 'bubble',
                                size: 'mega',
                                header: {
                                    type: 'box',
                                    layout: 'vertical',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ลงทะเบียนสำเร็จ!',
                                            weight: 'bold',
                                            color: '#FFD700',
                                            size: 'xl',
                                            align: 'center'
                                        }
                                    ],
                                    backgroundColor: '#000000',
                                    paddingAll: '10px'
                                },
                                body: {
                                    type: 'box',
                                    layout: 'vertical',
                                    contents: [
                                        {
                                            type: 'box',
                                            layout: 'horizontal',
                                            contents: [
                                                { type: 'text', text: 'ชื่อ-สกุล:', weight: 'bold', color: '#FFF', flex: 1 },
                                                { type: 'text', text: formData.fullName, color: '#FFF', flex: 2 }
                                            ]
                                        },
                                        {
                                            type: 'box',
                                            layout: 'horizontal',
                                            contents: [
                                                { type: 'text', text: 'เบอร์โทร:', weight: 'bold', color: '#FFF', flex: 1 },
                                                { type: 'text', text: formData.phoneNumber, color: '#FFF', flex: 2 }
                                            ]
                                        },
                                        {
                                            type: 'box',
                                            layout: 'horizontal',
                                            contents: [
                                                { type: 'text', text: 'ทะเบียนรถ:', weight: 'bold', color: '#FFF', flex: 1 },
                                                { type: 'text', text: formData.licensePlate, color: '#FFF', flex: 2 }
                                            ]
                                        },
                                        {
                                            type: 'box',
                                            layout: 'horizontal',
                                            contents: [
                                                { type: 'text', text: 'วันลงทะเบียน:', weight: 'bold', color: '#FFF', flex: 1 },
                                                { type: 'text', text: formData.currentDate, color: '#FFF', flex: 2 }
                                            ]
                                        }
                                    ],
                                    backgroundColor: '#333333',
                                    paddingAll: '15px'
                                },
                                footer: {
                                    type: 'box',
                                    layout: 'vertical',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ขอบคุณที่ลงทะเบียน',
                                            color: '#FFD700',
                                            size: 'sm',
                                            align: 'center'
                                        }
                                    ],
                                    backgroundColor: '#000000',
                                    paddingAll: '10px'
                                }
                            }
                        }
                    ]);
                    console.log('Flex message sent!');
                }
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            loadingOverlay.style.display = 'none'; // Hide loading overlay
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
        }
    });

    closeWindowBtn.addEventListener('click', function() {
        if (liff.isInClient()) {
            liff.closeWindow();
        } else {
            // Fallback for non-LIFF environment
            alert('คุณสามารถปิดหน้านี้ได้เลย');
        }
    });
});
