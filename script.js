// ==========================================
// 1. مولد الأصوات التفاعلية (مُحسن وخفيف)
// ==========================================
let sharedAudioCtx = null;

function playPopSound() {
    try {
        if (!sharedAudioCtx) {
            sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume();
        }
        const oscillator = sharedAudioCtx.createOscillator();
        const gainNode = sharedAudioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, sharedAudioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, sharedAudioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, sharedAudioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, sharedAudioCtx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(sharedAudioCtx.destination);
        
        oscillator.start();
        oscillator.stop(sharedAudioCtx.currentTime + 0.1);
    } catch (e) {}
}

// ==========================================
// 2. تأثير الـ Confetti والجسيمات المتطايرة
// ==========================================
function triggerConfetti() {
    if (typeof confetti === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
        script.onload = () => runConfettiAnimation();
        document.head.appendChild(script);
    } else {
        runConfettiAnimation();
    }
}

function runConfettiAnimation() {
    confetti({
        particleCount: 60, // خفضنا العدد لحماية أداء الموبايل
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f39c12', '#e74c3c', '#f1c40f', '#ffffff']
    });
}

// --- الفلترة بين الأقسام ---
function filterCategory(event, categoryClass) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.menu-grid .card').forEach(card => {
        if (categoryClass === 'all' || card.classList.contains(categoryClass)) {
            card.classList.remove('hide');
            card.classList.remove('animate-filter');
            void card.offsetWidth; 
            card.classList.add('animate-filter');
        } else {
            card.classList.add('hide');
        }
    });
}

// --- إدارة سلة الطلبات والـ Modal ---
let cart = [];
let currentItemData = null;
let currentModalQty = 1;
let removedIngredients = [];

const modal = document.getElementById('itemModal');
const closeModalBtn = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalIngredientsTags = document.getElementById('modalIngredientsTags');
const modalQtySpan = document.getElementById('modalQty');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');

// فتح الـ Modal عند الضغط على الوجبة
document.querySelectorAll('.menu-grid .card').forEach(card => {
    card.addEventListener('click', () => {
        playPopSound();
        currentItemData = {
            name: card.getAttribute('data-name'),
            price: parseInt(card.getAttribute('data-price')),
            img: card.getAttribute('data-img'),
            ingredients: card.getAttribute('data-ingredients')
        };

        currentModalQty = 1;
        removedIngredients = [];
        modalQtySpan.textContent = currentModalQty;

        modalImg.src = currentItemData.img;
        modalTitle.textContent = currentItemData.name;
        modalPrice.textContent = currentItemData.price + ",000 L.L";

        // تقسيم المكونات إلى أزرار قابلة للإزالة
        modalIngredientsTags.innerHTML = '';
        if (currentItemData.ingredients) {
            let ingList = currentItemData.ingredients.split(/[,،]/).map(i => i.trim()).filter(i => i.length > 0);
            ingList.forEach(ing => {
                let span = document.createElement('span');
                span.className = 'ingredient-tag';
                span.innerHTML = `<i class="fa-solid fa-check"></i> ${ing}`;
                span.addEventListener('click', () => {
                    span.classList.toggle('removed');
                    if (span.classList.contains('removed')) {
                        span.innerHTML = `<i class="fa-solid fa-xmark"></i> <b>بدون ${ing}</b>`;
                        removedIngredients.push(ing);
                    } else {
                        span.innerHTML = `<i class="fa-solid fa-check"></i> ${ing}`;
                        removedIngredients = removedIngredients.filter(item => item !== ing);
                    }
                });
                modalIngredientsTags.appendChild(span);
            });
        }

        if (modal) modal.classList.add('active');
    });
});

// إغلاق الـ Modal
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// تحكم بالكمية داخل الـ Modal
const modalPlus = document.querySelector('.modal-plus');
const modalMinus = document.querySelector('.modal-minus');

if (modalPlus) {
    modalPlus.addEventListener('click', () => {
        currentModalQty++;
        modalQtySpan.textContent = currentModalQty;
    });
}
if (modalMinus) {
    modalMinus.addEventListener('click', () => {
        if (currentModalQty > 1) {
            currentModalQty--;
            modalQtySpan.textContent = currentModalQty;
        }
    });
}

// --- إضافة الوجبة للسلة (مع تأثير خفيف وخالٍ من الـ Lag) ---
if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
        if (!currentItemData) return;
        
        // تأثير طيران مبسط وخفيف جداً لا يسبب تقطيعاً على الهواتف
        if (modalImg) {
            const imgRect = modalImg.getBoundingClientRect();
            const cartTarget = document.querySelector('.cart-icon') || document.querySelector('#cartTotal') || document.body;
            const targetRect = cartTarget.getBoundingClientRect();

            let flyer = document.createElement('img');
            flyer.src = modalImg.src;
            flyer.style.cssText = `
                position: fixed;
                z-index: 99999;
                left: ${imgRect.left}px;
                top: ${imgRect.top}px;
                width: ${imgRect.width}px;
                height: ${imgRect.height}px;
                border-radius: 12px;
                object-fit: cover;
                transition: transform 0.6s ease, opacity 0.6s ease;
                pointer-events: none;
            `;
            document.body.appendChild(flyer);

            requestAnimationFrame(() => {
                flyer.style.transform = `translate(${targetRect.left - imgRect.left}px, ${targetRect.top - imgRect.top}px) scale(0.2)`;
                flyer.style.opacity = '0.3';
            });

            setTimeout(() => {
                flyer.remove();
            }, 600);
        }

        playPopSound();

        let cartItem = {
            name: currentItemData.name,
            price: currentItemData.price,
            qty: currentModalQty,
            removed: [...removedIngredients]
        };

        cart.push(cartItem);
        updateCartUI();
        modal.classList.remove('active');
    });
}

// تحديث واجهة السلة
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceEl = document.getElementById('totalPrice');
    const sendOrderBtn = document.getElementById('sendOrderBtn');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-msg">لم تقم بإضافة أي وجبة بعد</p>`;
        if (totalPriceEl) totalPriceEl.textContent = "0 L.L";
        if (sendOrderBtn) sendOrderBtn.disabled = true;
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.qty;
        total += itemTotal;

        let notesText = item.removed && item.removed.length > 0 ? `<br><small style="color: #ff4757;">بدون: ${item.removed.join(', ')}</small>` : '';

        html += `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                <div>
                    <strong>${item.name}</strong> (x${item.qty})${notesText}
                    <div style="font-size: 0.85rem; opacity: 0.8;">${itemTotal.toLocaleString()},000 L.L</div>
                </div>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4757; cursor: pointer; font-size: 1rem;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });

    const orderTypeEl = document.querySelector('input[name="orderType"]:checked');
    const orderTypeValue = orderTypeEl ? orderTypeEl.value : "";
    const isDelivery = orderTypeValue.includes('دليفري') || orderTypeValue.includes('توصيل');

    if (isDelivery) {
        total += 100;
        html += `
            <div class="cart-item delivery-fee-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; color: #f39c12;">
                <div>
                    <strong>🛵 رسم التوصيل (دليفري)</strong>
                </div>
                <div>100,000 L.L</div>
            </div>
        `;
    }

    cartItemsContainer.innerHTML = html;
    if (totalPriceEl) totalPriceEl.textContent = `${total.toLocaleString()},000 L.L`;
    if (sendOrderBtn) sendOrderBtn.disabled = false;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// التحكم بتفعيل أزرار طريقة الاستلام
document.querySelectorAll('.order-type-options .type-option, input[name="orderType"]').forEach(element => {
    element.addEventListener('click', () => {
        document.querySelectorAll('.order-type-options .type-option').forEach(l => l.classList.remove('active'));
        const radio = element.querySelector ? element.querySelector('input') : null;
        if (radio) {
            radio.checked = true;
            element.classList.add('active');
        } else if (element.tagName === 'INPUT') {
            element.checked = true;
            if (element.closest('.type-option')) element.closest('.type-option').classList.add('active');
        }
        updateCartUI();
    });
});

// التحكم بتفعيل خيارات الدفع
document.querySelectorAll('.payment-type-options .type-option, input[name="paymentType"]').forEach(element => {
    element.addEventListener('click', () => {
        document.querySelectorAll('.payment-type-options .type-option').forEach(l => l.classList.remove('active'));
        const radio = element.querySelector ? element.querySelector('input') : null;
        if (radio) {
            radio.checked = true;
            element.classList.add('active');
        } else if (element.tagName === 'INPUT') {
            element.checked = true;
            if (element.closest('.type-option')) element.closest('.type-option').classList.add('active');
        }
    });
});

// --- عداد التوصيل العكسي (20 دقيقة) ---
let timeRemaining = 20 * 60;
let countdownInterval = null;
const countdownTimer = document.getElementById('countdownTimer');

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    timeRemaining = 20 * 60;
    
    if (countdownTimer) {
        countdownInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                let minutes = Math.floor(timeRemaining / 60);
                let seconds = timeRemaining % 60;
                countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                countdownTimer.textContent = "وصل الطلب للبيت! 🛵🔥";
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
}

// --- إرسال الطلب عبر الواتساب ---
const sendOrderBtn = document.getElementById('sendOrderBtn');
if (sendOrderBtn) {
    sendOrderBtn.addEventListener('click', function() {
        if (cart.length === 0) return;

        const nameInput = document.getElementById('customerName');
        const addressInput = document.getElementById('customerAddress');
        
        const customerName = nameInput ? nameInput.value.trim() : "";
        const customerAddress = addressInput ? addressInput.value.trim() : "";
        
        if (!customerName) {
            alert("الرجاء إدخال الاسم الكريم لنتمكن من إرسال الطلب! 📝");
            if (nameInput) nameInput.focus();
            return;
        }

        const orderTypeEl = document.querySelector('input[name="orderType"]:checked');
        const orderType = orderTypeEl ? orderTypeEl.value : "توصيل دليفري";
        const isDelivery = orderType.includes('دليفري') || orderType.includes('توصيل');

        const paymentTypeEl = document.querySelector('input[name="paymentType"]:checked');
        const paymentType = paymentTypeEl ? paymentTypeEl.value : "Cash";

        let cartDetails = "";
        let calculatedTotal = 0;

        cart.forEach((item) => {
            const itemTotal = (item.price || 0) * (item.qty || 1);
            calculatedTotal += itemTotal;
            
            cartDetails += `• ${item.name} (عدد: ${item.qty || 1}) - ${itemTotal.toLocaleString()},000 L.L%0A`;
            
            if (item.removed && item.removed.length > 0) {
                cartDetails += `  (بدون: ${item.removed.join(', ')})%0A`;
            }
        });

        if (isDelivery) {
            calculatedTotal += 100;
            cartDetails += `• 🛵 رسم التوصيل - 100,000 L.L%0A`;
        }

        let message = `مرحباً صخر صاج 🌯🔥%0A%0A`;
        message += `👤 *اسم الزبون:* ${customerName}%0A`;
        message += `📍 *العنوان:* ${customerAddress ? customerAddress : "لم يتم إدخال العنوان"}%0A`;
        message += `🛵 *طريقة الاستلام:* ${orderType}%0A`;
        message += `💳 *طريقة الدفع:* ${paymentType}%0A`;
        message += `------------------%0A`;
        message += `🛒 *تفاصيل الطلب:*%0A` + cartDetails;
        message += `------------------%0A`;
        message += `💰 *المجموع الكلي:* ${calculatedTotal.toLocaleString()},000 L.L%0A`;

        triggerConfetti();
        playPopSound();
        startCountdown();

        const phoneNumber = "96181046949";
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

        setTimeout(() => {
            let anchor = document.createElement('a');
            anchor.href = whatsappUrl;
            anchor.target = '_blank';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }, 400);
    });
}