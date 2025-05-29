// ---- CONFIGURATION ----
const LIFF_ID_REGISTER = "2007499630-0J5jPaaP"; // <--- ใส่ LIFF ID สำหรับหน้าลงทะเบียนของคุณ
const GAS_APP_URL = "https://script.google.com/macros/s/AKfycbyQ1BAC9E76wVrWut48qTWVb57FlB6jNs83oUNbkRfLbFPkaqw59Enu67LMre_5xyERYg/exec"; // <--- ใส่ URL ของ Google Apps Script Web App ของคุณ
// ---- END CONFIGURATION ----

document.addEventListener('DOMContentLoaded', () => {
    initializeLiff();
});

let lineUserId = null; // Store LINE User ID globally

async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID_REGISTER });
        if (!liff.isLoggedIn()) {
            liff.login(); // Redirect to LINE login if not logged in
            return;
        }
        const profile = await liff.getProfile();
        lineUserId = profile.userId; // Get user ID
        setWarrantyDate(); // Set current date for warranty
    } catch (error) {
        console.error('LIFF Initialization failed', error);
        document.getElementById('message').textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูล LINE';
        document.getElementById('message').className = 'error';
    }
}

function setWarrantyDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = today.getFullYear();
    document.getElementById('warrantyDate').value = `${day}/${month}/${year}`;
}

document.getElementById('remapForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!lineUserId) {
        document.getElementById('message').textContent = 'ไม่สามารถดึง LINE User ID ได้ กรุณาลองอีกครั้ง';
        document.getElementById('message').className = 'error';
        return;
    }

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.textContent = 'กำลังบันทึก...';

    const formData = {
        lineUserId: lineUserId,
        fullName: document.getElementById('fullName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        licensePlate: document.getElementById('licensePlate').value,
        warrantyDate: document.getElementById('warrantyDate').value
    };

    try {
        const response = await fetch(GAS_APP_URL, {
            method: 'POST',
            mode: 'cors', // CORS is important for cross-origin requests
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            redirect: "follow" // Google Apps Script Web Apps often redirect
        });

        const result = await response.json();

        if (result.status === 'success') {
            document.getElementById('message').textContent = 'บันทึกข้อมูลเรียบร้อยแล้ว!';
            document.getElementById('message').className = 'success';
            document.getElementById('remapForm').style.display = 'none'; // Hide form
            document.getElementById('closeButton').style.display = 'block'; // Show close button

            // Send Flex Message
            if (liff.isInClient()) { // Check if opened in LINE app
                const flexMessage = createFlexMessage(formData);
                await liff.sendMessages([flexMessage]);
            } else {
                console.log("Not in LINE client, Flex Message not sent via LIFF.sendMessages(). Data:", formData);
            }

        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    } catch (error) {
        console.error('Submit error:', error);
        document.getElementById('message').textContent = `ผิดพลาด: ${error.message}`;
        document.getElementById('message').className = 'error';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'บันทึกข้อมูล';
    }
});

document.getElementById('closeButton').addEventListener('click', () => {
    if (liff.isInClient()) {
        liff.closeWindow();
    } else {
        // Fallback for browsers or if liff.closeWindow() is not available
        window.alert("กรุณาปิดหน้าต่างนี้ด้วยตนเอง");
    }
});

function createFlexMessage(data) {
    return {
        type: "flex",
        altText: "บันทึกข้อมูลรีแมพเรียบร้อย",
        contents: {
            type: "bubble",
            hero: {
                type: "image",
                url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png", // Placeholder, change to your image
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover",
                action: { type: "uri", uri: "https://line.me" }
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "✅ บันทึกข้อมูลเรียบร้อย",
                        weight: "bold",
                        size: "xl",
                        color: "#ffd700" // Gold
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "ชื่อ-สกุล:", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: data.fullName, wrap: true, color: "#ffffff", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "เบอร์โทร:", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: data.phoneNumber, wrap: true, color: "#ffffff", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "ทะเบียนรถ:", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: data.licensePlate, wrap: true, color: "#ffffff", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "วันที่ประกัน:", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: data.warrantyDate, wrap: true, color: "#ffffff", size: "sm", flex: 5 }
                                ]
                            }
                        ]
                    }
                ],
                backgroundColor: "#2c2c2c" // Dark gray
            },
            styles: {
                hero: {
                    backgroundColor: "#1a1a1a"
                }
            }
        }
    };
}
