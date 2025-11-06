    function displayPhotoPreviews(items) {
        const previewContainer = document.getElementById('photo-preview-container');
        if (!items) return;
        for (const item of items) {
            if (item instanceof File) {
                if (!item.type.startsWith('image/')){ continue; }
                const reader = new FileReader();
                reader.onload = function(e) {
                    createPreviewElement(e.target.result);
                }
                reader.readAsDataURL(item);
            }
            else if (typeof item === 'string' && item.startsWith('data:image')) {
                createPreviewElement(item);
            }
        }
        function createPreviewElement(src) {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            const img = document.createElement('img');
            img.src = src;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-photo-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = function() { previewItem.remove(); };
            previewItem.appendChild(img);
            previewItem.appendChild(deleteBtn);
            previewContainer.appendChild(previewItem);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const setVh = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);


        document.querySelectorAll('.rating-hearts .fa-heart').forEach(heart => {
            heart.addEventListener('click', handleRatingClick);
            heart.addEventListener('mouseover', handleRatingHover);
            heart.addEventListener('mouseout', handleRatingMouseout);
        });
        qrModal = document.getElementById('qr-scanner-modal');
        video = document.getElementById('qr-scanner-video');
        canvasElement = document.getElementById('qr-canvas');
        canvas = canvasElement.getContext('2d');
        qrStatusText = document.getElementById('qr-status-text');
        scanBox = document.getElementById('scan-box');
        const btnSelectAlbum = document.getElementById('btn-select-from-album');
        const btnOpenCamera = document.getElementById('btn-open-camera');
        const photoFileInput = document.getElementById('photo-file-input');
        const cameraFileInput = document.getElementById('camera-file-input');
        btnSelectAlbum.addEventListener('click', () => photoFileInput.click());
        btnOpenCamera.addEventListener('click', () => cameraFileInput.click());
        const handleFileSelection = (event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                displayPhotoPreviews(files);
            }
            event.target.value = null;
        };
        photoFileInput.addEventListener('change', handleFileSelection);
        cameraFileInput.addEventListener('change', handleFileSelection);
        window.showPage('map-page', document.querySelector('.nav-item'));
    });