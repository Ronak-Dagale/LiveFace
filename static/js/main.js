// # App JavaScript #

// # Event Listener 
document.addEventListener('DOMContentLoaded', main)

// # Main Function
function main() {
    // # DOM Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const resetBtn = document.getElementById('resetBtn');
    const fileInput = document.getElementById('fileInput');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const previewImg = document.getElementById('previewImg');
    const cameraView = document.getElementById('cameraView');
    const imagePreview = document.getElementById('imagePreview');
    const defaultState = document.getElementById('defaultState');
    const toggleImagePreviewButton = document.getElementById('toggleImagePreviewButton');
    const toggleImagePreviewButtonIcon = document.getElementById('toggleImagePreviewButtonIcon');
    const toggleImagePreviewButtonText = document.getElementById('toggleImagePreviewButtonText');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsDefaultState = document.getElementById('resultsDefaultState');
    const processingIndicator = document.getElementById('processingIndicator');
    const resultIcon = document.getElementById('resultIcon');
    const resultText = document.getElementById('resultText');
    const confidenceText = document.getElementById('confidenceText');
    const featureAnalysis = document.getElementById('featureAnalysis');
    const realFaceAnalysis = document.getElementById('realFaceAnalysis');
    const explanationsList = document.getElementById('explanationsList');
    const realFaceDetails = document.getElementById('realFaceDetails');
    const toastContainer = document.getElementById('toastContainer');

    // # Constant Variables
    const serverURL = 'http://localhost:3000/api/v1';
    const originalImagePath = '/api/v1/uploads/input_image.png';
    const heatmapImagePath = '/api/v1/uploads/heatmap_image.png';

    // # State Variables
    let stream = null; // # For camera stream
    let currentImageState = 'original'; // # Can be 'original' or 'heatmap'

    // # Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', uploadImage);
    cameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureImage);
    resetBtn.addEventListener('click', resetState);
    toggleImagePreviewButton.addEventListener('click', showImagePreview);

    // # Start Camera Function
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            cameraView.classList.remove('hidden');
            imagePreview.classList.add('hidden');
            defaultState.classList.add('hidden');
            cameraBtn.disabled = true;
            uploadBtn.disabled = true;
        } catch (err) {
            console.error('error accessing camera:', err);
            showToast('Error accessing camera. Please check permissions.', 'error');
        }
    }

    // # Capture Image Function
    function captureImage() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        processImage(imageData);
    }

    // # File Upload Function
    function uploadImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                processImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // # Show Image Preview Function
    function showImagePreview() {
        if (currentImageState === 'original') {
            // # Show 'original' image
            previewImg.src = originalImagePath;

            // # Switch to 'heatmap' image
            currentImageState = 'heatmap';
            toggleImagePreviewButton.className = 'px-4 py-2 rounded-lg shadow-md bg-pink-500 text-white hover:bg-pink-600 transition-all';
            toggleImagePreviewButtonIcon.className = 'fas fa-fire mr-2';
            toggleImagePreviewButtonText.textContent = 'Heatmap Image';
        } else {
            // # Show 'heatmap' image
            previewImg.src = heatmapImagePath;

            // # Switch to 'original' image
            currentImageState = 'original';
            toggleImagePreviewButton.className = 'px-4 py-2 rounded-lg shadow-md bg-indigo-500 text-white hover:bg-indigo-600 transition-all';
            toggleImagePreviewButtonIcon.className = 'fas fa-image mr-2';
            toggleImagePreviewButtonText.textContent = 'Original Image';
        }
    }

    // # Show Toast Notification Function
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.innerHTML = type === 'success' ? '✔️' : '❌';

        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'ml-4 text-md text-black font-extrabold';
        closeBtn.innerHTML = 'X';
        closeBtn.onclick = () => {
            toast.classList.add('hide');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        };

        toast.appendChild(icon);
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        toastContainer.appendChild(toast);

        // # Remove the toast after 3 seconds if not manually closed
        const autoClose = setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toast.classList.add('hide');
                setTimeout(() => {
                    toastContainer.removeChild(toast);
                }, 300);
            }
        }, 3000);

        // # Clear the timeout if toast is manually closed
        toast.onclick = () => {
            clearTimeout(autoClose);
            toast.classList.add('hide');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        };
    }

    // # Process Image Function
    async function processImage(imageData) {
        try {
            // # Show processing indicator
            processingIndicator.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            resultsDefaultState.classList.add('hidden');

            // # Upload the image
            const uploadImageEndpoint = serverURL + '/upload/image';
            const uploadImageRequest = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageData }),
            }
            const uploadImageResponse = await fetch(
                uploadImageEndpoint,
                uploadImageRequest
            )

            if (!uploadImageResponse.ok) {
                const errorData = await uploadImageResponse.json();
                showToast(errorData.error || 'Failed to upload image', 'error');
                throw new Error(errorData.error || 'failed to upload image');
            }

            showToast('Image uploaded successfully!');

            // # Analyze the uploaded image
            const analyzeImageEndpoint = serverURL + '/analyze/image';
            const analyzeImageRequest = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
            const analyzeImageResponse = await fetch(
                analyzeImageEndpoint,
                analyzeImageRequest
            )

            if (!analyzeImageResponse.ok) {
                const errorData = await analyzeImageResponse.json();
                showToast(errorData.error || 'Failed to analyze image', 'error');
                throw new Error(errorData.error || 'failed to analyze image');
            }

            const result = await analyzeImageResponse.json();
            displayResults(result);
            showToast('Analysis completed successfully!');
        } catch (error) {
            console.error('error processing image:', error);
            showToast(error.message, 'error');
        } finally {
            processingIndicator.classList.add('hidden');
        }
    }

    // # Display Results Function
    function displayResults(result) {
        // # Update UI with results
        resultsContainer.classList.remove('hidden');
        resultsDefaultState.classList.add('hidden');

        // # Set result icon and text
        if (result.isReal) {
            resultIcon.className = 'fas fa-check-circle text-green-500';
            resultText.textContent = 'Real Face Detected';
            resultText.className = 'text-green-700';
            confidenceText.textContent = `Confidence: ${result.confidence.toFixed(2)}%`;

            // # Show real face analysis
            featureAnalysis.classList.add('hidden');
            realFaceAnalysis.classList.remove('hidden');

            // # Display real face details
            realFaceDetails.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">Natural Skin Texture</span>
                        <div class="w-32 bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full bg-green-600" style="width: 95%"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">Consistent Lighting</span>
                        <div class="w-32 bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full bg-green-600" style="width: 90%"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">Natural Reflections</span>
                        <div class="w-32 bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full bg-green-600" style="width: 88%"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultIcon.className = 'fas fa-times-circle text-red-500';
            resultText.textContent = 'Fake Face Detected';
            resultText.className = 'text-red-700';
            confidenceText.textContent = `Confidence: ${result.confidence.toFixed(2)}%`;

            // # Show feature analysis
            featureAnalysis.classList.remove('hidden');
            realFaceAnalysis.classList.add('hidden');

            // # Display explanations
            explanationsList.innerHTML = '';
            if (result.explanations) {
                result.explanations.forEach(explanation => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between';
                    div.innerHTML = `
                        <span class="text-gray-700">${explanation.feature}</span>
                        <div class="w-32 bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full ${explanation.isReal ? 'bg-green-600' : 'bg-red-600'}" 
                                 style="width: ${explanation.confidence * 100}%"></div>
                        </div>
                    `;
                    explanationsList.appendChild(div);
                });
            }
        }

        // # Show image preview with toggle buttons
        document.getElementById('imagePreview').classList.remove('hidden');
        document.getElementById('defaultState').classList.add('hidden');
        showImagePreview('original');

        // # Show reset button
        resetBtn.classList.remove('hidden');
        toggleImagePreviewButton.classList.remove('hidden');
    }

    // # Reset State Function
    function resetState() {
        // # Stop camera if active
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // # Reset UI elements
        cameraView.classList.add('hidden');
        imagePreview.classList.add('hidden');
        defaultState.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        resultsDefaultState.classList.remove('hidden');
        resetBtn.classList.add('hidden');
        cameraBtn.disabled = false;
        uploadBtn.disabled = false;
        fileInput.value = '';
        video.srcObject = null;

        showToast('LiveFace software reset successfully!');
    }
}