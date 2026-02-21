// Image utilities for chat app (Imgur upload + Firebase resources)

const IMGUR_CLIENT_ID = 'cfb9241edbf292e'; // Same as wiki

// Open image selector modal with callback
function openImageSelector(callback) {
    imageCallbackFn = callback;
    selectedImageUrl = null;
    imageSelectorModal.classList.remove('hidden');
    imageUploadStatus.textContent = '';
    imageFileInput.value = '';
    selectedImagePreview.innerHTML = '<div style="color: #999;">선택된 이미지 없음</div>';
    confirmImageSelectorBtn.disabled = true;
    loadSavedImages();
}

// Close image selector modal
function closeImageSelector() {
    imageSelectorModal.classList.add('hidden');
    selectedImageUrl = null;
    imageCallbackFn = null;
}

// Upload image to Imgur
async function uploadByImgur(file) {
    try {
        imageUploadStatus.textContent = '업로드 중...';
        const bodyData = new FormData();
        bodyData.append('image', file);

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
                Accept: 'application/json',
            },
            body: bodyData,
        });

        const result = await response.json();

        if (result.status === 200) {
            imageUploadStatus.textContent = '✓ 업로드 완료';
            // Register in Firebase resources
            if (window.chatFb && window.chatFb.resources) {
                try {
                    await window.chatFb.resources.regist(result.data);
                } catch (e) {
                    console.warn('Firebase resource registration failed:', e);
                }
            }
            selectImage(result.data.link);
            return result.data.link;
        } else {
            imageUploadStatus.textContent = '❌ 업로드 실패';
            return null;
        }
    } catch (error) {
        console.error('Upload error:', error);
        imageUploadStatus.textContent = '❌ 업로드 실패';
        return null;
    }
}

// Delete image from Imgur
async function deleteImgurImg(deleteHash) {
    try {
        const response = await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
                Accept: 'application/json'
            }
        });
        const result = await response.json();
        return result.status === 200;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

// Load saved images from Firebase resources
async function loadSavedImages() {
    if (!window.chatFb || !window.chatFb.resources) {
        imageSelectorList.innerHTML = '<p style="color: #999; font-size: 12px;">Firebase not initialized</p>';
        return;
    }

    try {
        imageSelectorList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">로드 중...</p>';
        const result = await window.chatFb.resources.all();

        if (!result.docs || result.docs.length === 0) {
            imageSelectorList.innerHTML = '<p style="color: #999; font-size: 12px;">저장된 이미지 없음</p>';
            return;
        }

        imageSelectorList.innerHTML = '';
        result.docs.forEach(doc => {
            const data = doc.data();
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'gallery';
            radio.className = 'image-selector-item';
            radio.value = data.link;
            radio.style.backgroundImage = `url('${data.link}')`;
            radio.setAttribute('data-id', doc.id);
            radio.addEventListener('change', () => selectImage(data.link));
            imageSelectorList.appendChild(radio);
        });
    } catch (error) {
        console.error('Error loading images:', error);
        imageSelectorList.innerHTML = '<p style="color: #999; font-size: 12px;">이미지 로드 실패</p>';
    }
}

// Select an image and show preview
function selectImage(url) {
    selectedImageUrl = url;
    confirmImageSelectorBtn.disabled = false;
    selectedImagePreview.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 150px; border-radius: 8px;" alt="preview" />`;
}

// Confirm and callback
function confirmImageSelection() {
    if (selectedImageUrl && imageCallbackFn) {
        imageCallbackFn(selectedImageUrl);
        closeImageSelector();
    }
}

// Open prompt for image link
function promptImageLink() {
    const link = prompt('사용할 이미지의 URL을 입력해 주세요');
    if (link && link.trim()) {
        selectImage(link.trim());
    }
}
