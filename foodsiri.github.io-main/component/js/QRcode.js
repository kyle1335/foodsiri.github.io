    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            qrStatusText.textContent = '掃描中...';
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                handleQrCodeResult(code.data);
                return;
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    }


    function parseLeftQRCode(data) {
        if (typeof data !== 'string' || data.length < 77) return null;
        try {
            const totalAmountHex = data.substring(29, 37);
            const totalAmount = parseInt(totalAmountHex, 16);
            if (isNaN(totalAmount)) return null;
            return { totalAmount };
        } catch (e) {
            return null;
        }
    }

    function parseRightQRCode(data) {
        if (typeof data !== 'string' || !data.startsWith('**') && data.indexOf('*:') === -1) return null;

        let detailsData = data;
        if (data.startsWith('**')) {
            detailsData = data.substring(2);
        }

        try {
            const parts = detailsData.split(':');
            if (parts.length < 2) return null;

            const itemCount = parseInt(parts[1]);
            if (isNaN(itemCount) || itemCount <= 0) return null;

            let parsedItems = [];
            let currentIndex = 3;
            for (let i = 0; i < itemCount; i++) {
                if (currentIndex + 2 >= parts.length) break;

                const itemName = parts[currentIndex];
                const itemQuantity = parts[currentIndex + 1];

                if (itemName && itemQuantity) {
                    parsedItems.push(`${itemName} x ${itemQuantity}`);
                }
                currentIndex += 3;
            }

            return parsedItems.length > 0 ? { items: parsedItems } : null;
        } catch (e) {
            return null;
        }
    }

    function handleQrCodeResult(qrData) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        const leftQRResult = parseLeftQRCode(qrData);
        const rightQRResult = parseRightQRCode(qrData);

        if (!leftQRResult && !rightQRResult) {
            qrStatusText.textContent = '無法辨識的發票 QR Code 格式。';
            scanBox.style.borderColor = 'var(--danger-color)';
            setTimeout(() => {
                scanBox.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                if (qrModal.style.display === 'flex') requestAnimationFrame(tick);
            }, 2500);
            return;
        }

        scanBox.style.borderColor = 'var(--success-color)';
        let feedback = [];

        if (leftQRResult) {
            document.getElementById('review-cost').value = leftQRResult.totalAmount;
            feedback.push(`總金額 $${leftQRResult.totalAmount} 已填入！`);
        }

        if (rightQRResult) {
            const currentItems = document.getElementById('review-meal-items').value;
            const newItems = rightQRResult.items.join('\n');
            document.getElementById('review-meal-items').value = currentItems ? `${currentItems}\n${newItems}` : newItems;
            feedback.push(`${rightQRResult.items.length}筆商品明細已加入！`);
        }

        const feedbackMessage = feedback.join('\n');
        qrStatusText.textContent = feedbackMessage;

        setTimeout(() => {
            if (confirm(feedbackMessage + '\n\n是否要繼續掃描下一個 QR Code？')) {
                qrStatusText.textContent = '請對準下一個 QR Code...';
                scanBox.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                requestAnimationFrame(tick);
            } else {
                closeQrScanner();
            }
        }, 500);
    }