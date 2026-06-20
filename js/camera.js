// // --- DOM Elements ---
// // Grabbing all the HTML elements we need to interact with
// const uploadImageInput = document.getElementById('imageUpload');     // The hidden file input
// const cameraBtn = document.getElementById('cameraBtn');              // The "Use Camera" button
// const cameraOverlay = document.getElementById('cameraOverlay');      // The full-screen dark overlay for the camera
// const closeCameraBtn = document.getElementById('closeCamera');       // The 'X' button to close the camera
// const cameraStream = document.getElementById('cameraStream');        // The <video> element that shows the live feed
// const captureBtn = document.getElementById('captureBtn');            // The round button to snap a picture
// const cameraCanvas = document.getElementById('cameraCanvas');        // A hidden canvas used to freeze-frame the video
// const previewImage = document.getElementById('previewImage');        // The <img> element in the box where the final picture goes
// const placeholderContent = document.getElementById('placeholderContent'); // The default icon/text inside the box

// // This variable will hold our active camera stream so we can stop it later
// let stream = null;

// // --- Handle Direct File Uploads ---
// // This listens for when a user picks a file from their device using the "Upload" button
// uploadImageInput.addEventListener('change', (event) => {
//     const file = event.target.files[0]; // Get the first file selected
//     if (file) {
//         // createObjectURL creates a temporary, local URL for the selected file so the browser can display it
//         showPreview(URL.createObjectURL(file));
//     }
// });

// // --- Open the Camera Modal ---
// // This listens for clicks on the "Use Camera" button
// cameraBtn.addEventListener('click', async () => {
//     // 1. Show the full-screen camera overlay by removing the 'd-none' (display: none) class
//     document.body.style.overflow = 'hidden';
//     cameraOverlay.classList.remove('d-none');

//     try {
//         // 2. Ask the browser for permission to use the device's camera
//         // 'facingMode: environment' tells mobile devices we prefer the back camera
//         stream = await navigator.mediaDevices.getUserMedia({
//             video: { facingMode: 'environment' }
//         });

//         // 3. Connect the live camera stream to our <video> element so the user can see it
//         cameraStream.srcObject = stream;
//     } catch (err) {
//         // If the user denies permission, or no camera is found, we catch the error
//         console.error("Error accessing the camera", err);
//         alert("Could not access the camera. Please make sure you have granted permissions.");
//         closeCamera(); // Close the modal since we can't use the camera
//     }
// });

// // --- Close the Camera Modal ---
// // Listen for clicks on the 'X' button
// closeCameraBtn.addEventListener('click', closeCamera);

// function closeCamera() {
//     // 1. Hide the full-screen camera overlay
//     document.body.style.overflow = '';
//     cameraOverlay.classList.add('d-none');

//     // 2. If the camera is currently running, we need to turn it off to save battery/privacy
//     if (stream) {
//         // Find every video track in the stream and stop it
//         stream.getTracks().forEach(track => track.stop());
//         stream = null; // Reset our variable
//         cameraStream.srcObject = null; // Disconnect the stream from the video element
//     }
// }

// // --- Capture an Image from the Live Stream ---
// // Listen for clicks on the round capture button below the live video
// captureBtn.addEventListener('click', () => {
//     if (!stream) return; // Do nothing if the camera isn't running

//     // 1. Match our invisible canvas size to the exact, true resolution of the video feed
//     cameraCanvas.width = cameraStream.videoWidth;
//     cameraCanvas.height = cameraStream.videoHeight;

//     // 2. "Draw" the current frame of the live video onto our flat 2D canvas
//     const ctx = cameraCanvas.getContext('2d');
//     ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);

//     // 3. Convert that drawn canvas frame into a usable image format (a Data URL string)
//     // 'image/jpeg' provides good quality with smaller file sizes
//     const dataUrl = cameraCanvas.toDataURL('image/jpeg');

//     // 4. Send this captured image string to our preview function
//     showPreview(dataUrl);

//     // 5. Turn off the camera and hide the overlay now that we have our picture
//     closeCamera();
// });

// // --- Helper: Show the Final Image in the Box ---
// // This function takes an image source (either a file URL or a captured Data URL) and puts it on screen
// function showPreview(src) {
//     previewImage.src = src;                      // Set the image source
//     previewImage.classList.remove('d-none');     // Make the image visible
//     placeholderContent.classList.add('d-none');  // Hide the default "No image selected" text/icon
// }



// ─────────────────────────────────────────
// EcoSort AI — Camera Handler
// Manages webcam access and image capture
// ─────────────────────────────────────────

// Grab all camera-related elements
const cameraBtn     = document.getElementById('cameraBtn');
const cameraOverlay = document.getElementById('cameraOverlay');
const cameraStream  = document.getElementById('cameraStream');
const captureBtn    = document.getElementById('captureBtn');
const cameraCanvas  = document.getElementById('cameraCanvas');
const closeCamera   = document.getElementById('closeCamera');
const imageUpload   = document.getElementById('imageUpload');
const previewImage  = document.getElementById('previewImage');
const placeholder   = document.getElementById('placeholderContent');
const analyseBtn    = document.getElementById('analyseBtn');

let currentStream = null;  // Keeps track of active camera stream

// ── Open Camera ───────────────────────────
cameraBtn.addEventListener('click', async () => {
    try {
        // Request camera access from browser
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },  // Prefer rear camera
            audio: false
        });

        currentStream          = stream;
        cameraStream.srcObject = stream;

        // Show the overlay
        cameraOverlay.classList.remove('d-none');
        cameraOverlay.classList.add('d-flex');

    } catch (err) {
        alert('Camera access denied or not available. Please use the Upload option instead.');
        console.error('Camera error:', err);
    }
});

// ── Capture Photo ─────────────────────────
captureBtn.addEventListener('click', () => {
    const video  = cameraStream;
    const canvas = cameraCanvas;

    // Set canvas size to match video
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame onto canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to image URL and show preview
    const imageDataURL = canvas.toDataURL('image/jpeg', 0.95);
    showPreview(imageDataURL);

    // Stop camera and close overlay
    stopCamera();
});

// ── Close Camera ──────────────────────────
closeCamera.addEventListener('click', () => {
    stopCamera();
});

// ── Stop Camera Stream ────────────────────
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    cameraOverlay.classList.add('d-none');
    cameraOverlay.classList.remove('d-flex');
}

// ── Handle Image Upload ───────────────────
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result);
    reader.readAsDataURL(file);

    // Reset input so same file can be re-uploaded
    imageUpload.value = '';
});

// ── Show Image Preview ────────────────────
function showPreview(imageDataURL) {
    // Hide placeholder, show image
    placeholder.classList.add('d-none');
    previewImage.classList.remove('d-none');
    previewImage.src = imageDataURL;

    // Enable the Analyse button
    analyseBtn.disabled = false;

    // Reset results to default state when new image is loaded
    resetResults();
}

// ── Reset Results Panel ───────────────────
function resetResults() {
    const resultDefault = document.getElementById('resultDefault');
    const resultContent = document.getElementById('resultContent');
    const resultLoading = document.getElementById('resultLoading');

    resultDefault.classList.remove('d-none');
    resultContent.classList.add('d-none');
    resultLoading.classList.add('d-none');
}