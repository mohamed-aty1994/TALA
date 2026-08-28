// استرجاع البيانات أو إعدادها أول مرة
let products = JSON.parse(localStorage.getItem('soap_products')) || [
    { id: 1, name: 'صابون سائل ليمون (لتر)', price: 25, stock: 50, img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=300' },
    { id: 2, name: 'صابون وجه بلدي (قطعة)', price: 10, stock: 100, img: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300' }
];

let customers = JSON.parse(localStorage.getItem('soap_customers')) || [];
let sales = JSON.parse(localStorage.getItem('soap_sales')) || [];
let collections = JSON.parse(localStorage.getItem('soap_collections')) || [];
let expenses = JSON.parse(localStorage.getItem('soap_expenses')) || [];
let cart = []; // سلة المشتريات الحالية لفاتورة المحل

// إدارة التبويبات (Tabs Switcher)
function switchTab(tab) {
    const tabs = ['dashboard', 'products', 'sales', 'customers', 'collection', 'expenses'];
    tabs.forEach(t => {
        const el = document.getElementById(t + 'Tab');
        const nav = document.getElementById('nav' + t.charAt(0).toUpperCase() + t.slice(1));
        if(el) el.classList.add('hidden');
        if(nav) nav.className = "flex flex-col items-center gap-0.5 text-slate-400 font-medium px-3 py-1 rounded-xl transition";
    });

    const activeTab = document.getElementById(tab + 'Tab');
    const activeNav = document.getElementById('nav' + tab.charAt(0).toUpperCase() + tab.slice(1));
    
    if(activeTab) activeTab.classList.remove('hidden');
    if(activeNav) activeNav.className = "flex flex-col items-center gap-0.5 text-brand-500 font-bold px-3 py-1 rounded-xl transition";

    if(tab === 'dashboard') loadDashboard();
    if(tab === 'products') renderProductsManagement();
    if(tab === 'sales') { renderPOSProducts(); loadPOSCustomersDropdown(); }
    if(tab === 'customers') { backToCustomersList(); }
    if(tab === 'collection') loadDebtorsDropdown();
    if(tab === 'expenses') renderExpenses();
}

// 1. إدارة المنتجات والمخزون (إضافة وتعديل وحفظ بالصور)
document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editingId = document.getElementById('editingProductId').value;
    const name = document.getElementById('prodName').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const imageInput = document.getElementById('prodImgFile');

    const saveToLocalStorage = (imgSrc) => {
        if (editingId) {
            let prod = products.find(p => p.id == editingId);
            if (prod) {
                prod.name = name;
                prod.price = price;
                prod.stock = stock;
                if (imgSrc) prod.img = imgSrc;
            }
            alert('✨ تم تحديث بيانات المنتج بنجاح!');
        } else {
            products.push({
                id: Date.now(),
                name,
                price,
                stock,
                img: imgSrc || 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=300'
            });
            alert('🎉 تم إضافة المنتج الجديد للمخزن بنجاح!');
        }

        localStorage.setItem('soap_products', JSON.stringify(products));
        resetProductForm();
        renderProductsManagement();
    };

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (uploadEvent) {
            saveToLocalStorage(uploadEvent.target.result);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        if (editingId) {
            saveToLocalStorage(null);
        } else {
            saveToLocalStorage('https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=300');
        }
    }
});

function renderProductsManagement() {
    const list = document.getElementById('productsManageList');
    if(!list) return;
    list.innerHTML = '';
    
    if(products.length === 0) {
        list.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">لا توجد منتجات مضافة بعد.</p>';
        return;
    }

    products.forEach(p => {
        let stockAlert = p.stock <= 5 ? '<span class="text-rose-400 font-bold">(قرب ينفد!)</span>' : '';
        list.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm mb-2">
                <div class="flex items-center gap-2.5">
                    <img src="${p.img}" class="w-12 h-12 object-cover rounded-lg border border-slate-700 flex-shrink-0">
                    <div>
                        <p class="font-bold text-slate-200">${p.name}</p>
                        <p class="text-xs text-brand-400">${p.price} ج.م | المخزون: <span class="text-emerald-400 font-bold">${p.stock}</span> ${stockAlert}</p>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button type="button" onclick="editProduct(${p.id})" class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" onclick="deleteProduct(${p.id})" class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function editProduct(id) {
    const p = products.find(prod => prod.id == id);
    if(!p) return;

    document.getElementById('editingProductId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodStock').value = p.stock;
    
    document.getElementById('productFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> تعديل بيانات المنتج';
    document.getElementById('saveProdBtn').innerText = 'تحديث بيانات المنتج';
    document.getElementById('cancelEditBtn').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editingProductId').value = '';
    document.getElementById('productFormTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i> إضافة منتج جديد';
    document.getElementById('saveProdBtn').innerText = 'حفظ المنتج';
    document.getElementById('cancelEditBtn').classList.add('hidden');
}

function deleteProduct(id) {
    if(confirm('⚠️ هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('soap_products', JSON.stringify(products));
        renderProductsManagement();
    }
}

// 2. نظام سلة المشتريات وشاشة البيع
function renderPOSProducts() {
    loadPOSCustomersDropdown();
    const grid = document.getElementById('productsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    if(products.length === 0) {
        grid.innerHTML = '<p class="text-xs text-slate-500 text-center col-span-2 py-4">لا توجد منتجات متاحة.</p>';
        return;
    }

    products.forEach(p => {
        grid.innerHTML += `
            <div onclick="addToCart(${p.id})" class="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer hover:border-brand-500 transition shadow-md relative">
                <span class="absolute top-2 left-2 bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">مخزن: ${p.stock}</span>
                <img src="${p.img}" class="w-16 h-16 object-cover rounded-xl mb-2 shadow border border-slate-700">
                <h4 class="font-bold text-xs text-slate-200 mb-1">${p.name}</h4>
                <span class="text-xs text-brand-400 font-semibold">${p.price} ج.م</span>
            </div>
        `;
    });
}

function loadPOSCustomersDropdown() {
    const select = document.getElementById('posCustomerSelect');
    if(!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">اختر المحل المشتري...</option>';
    customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name} (${c.area})</option>`;
    });
    select.value = currentVal;
}

function addToCart(productId) {
    const p = products.find(prod => prod.id == productId);
    if(!p) return;

    if(p.stock <= 0) {
        alert('❌ عذراً، هذا المنتج نفد من المخزن!');
        return;
    }

    let cartItem = cart.find(item => item.id == productId);
    if(cartItem) {
        if(cartItem.qty + 1 > p.stock) {
            alert('⚠️ الكمية المطلوبة تتجاوز المتاح في المخزن!');
            return;
        }
        cartItem.qty += 1;
    } else {
        cart.push({
            id: p.id,
            name: p.name,
            price: p.price,
            qty: 1,
            maxStock: p.stock
        });
    }
    renderCart();
}

function updateCartQty(productId, change) {
    let cartItem = cart.find(item => item.id == productId);
    if(!cartItem) return;

    let newQty = cartItem.qty + change;
    let p = products.find(prod => prod.id == productId);
    let maxStock = p ? p.stock : cartItem.maxStock;

    if(newQty <= 0) {
        cart = cart.filter(item => item.id !== productId);
    } else if(newQty > maxStock) {
        alert('⚠️ الكمية تتجاوز المتاح بالمخزن!');
        return;
    } else {
        cartItem.qty = newQty;
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const countBadge = document.getElementById('cartCount');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if(!list) return;

    list.innerHTML = '';
    if(cart.length === 0) {
        list.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">السلة فارغة، اختر منتجات من تحت 👇</p>';
        countBadge.innerText = '0 اصناف';
        totalPriceEl.innerText = '0 ج.م';
        return;
    }

    let totalSum = 0;
    let totalCount = 0;

    cart.forEach(item => {
        let itemTotal = item.qty * item.price;
        totalSum += itemTotal;
        totalCount += item.qty;

        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs">
                <div>
                    <p class="font-bold text-slate-200">${item.name}</p>
                    <p class="text-[10px] text-brand-400">${item.price} ج.م × ${item.qty} = <span class="font-bold text-white">${itemTotal} ج.م</span></p>
                </div>
                <div class="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                    <button type="button" onclick="updateCartQty(${item.id}, -1)" class="text-slate-300 font-bold px-1">-</button>
                    <span class="font-bold text-white">${item.qty}</span>
                    <button type="button" onclick="updateCartQty(${item.id}, 1)" class="text-slate-300 font-bold px-1">+</button>
                </div>
            </div>
        `;
    });

    countBadge.innerText = `${totalCount} قطعة`;
    totalPriceEl.innerText = `${totalSum} ج.م`;
}

function checkoutCart(saleType) {
    const customerId = document.getElementById('posCustomerSelect').value;
    if(!customerId) {
        alert('⚠️ من فضلك اختر المحل المشتري أولاً أعلى الصفحة!');
        return;
    }

    if(cart.length === 0) {
        alert('⚠️ السلة فارغة! أضف منتجات أولاً.');
        return;
    }

    let cust = customers.find(c => c.id == customerId);
    if(!cust) return;

    let invoiceTotal = 0;
    let itemsSummaryText = '';

    cart.forEach(cartItem => {
        let prod = products.find(p => p.id == cartItem.id);
        if(prod) {
            prod.stock -= cartItem.qty;
        }
        let itemTotal = cartItem.qty * cartItem.price;
        invoiceTotal += itemTotal;
        itemsSummaryText += `• ${cartItem.qty}x ${cartItem.name} (${itemTotal} ج.م)\n`;
    });

    localStorage.setItem('soap_products', JSON.stringify(products));

    const todayStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateTimeStr = `${todayStr} ${timeStr}`;

    if (saleType === 'cash') {
        if(!cust.history) cust.history = [];
        cust.history.unshift({
            type: 'collection',
            details: `شراء كاش (مجموعة أصناف)`,
            amount: invoiceTotal,
            date: dateTimeStr
        });

        let collections = JSON.parse(localStorage.getItem('soap_collections')) || [];
        collections.push({ customerId, amount: invoiceTotal, date: todayStr });
        localStorage.setItem('soap_collections', JSON.stringify(collections));

        alert(`✅ تم إتمام الفاتورة (كاش) لـ ${cust.name} بإجمالي ${invoiceTotal} ج.م بنجاح!`);
    } else {
        cust.balance += invoiceTotal;
        if(!cust.history) cust.history = [];
        cust.history.unshift({
            type: 'sale',
            details: `شراء أجل (مجموعة أصناف)`,
            amount: invoiceTotal,
            date: dateTimeStr
        });

        sales.push({ customerId, details: `مجموعة أصناف متعددة`, total: invoiceTotal, date: todayStr });
        localStorage.setItem('soap_sales', JSON.stringify(sales));

        alert(`✅ تم تسجيل الفاتورة (بالأجل) لـ ${cust.name} بإجمالي ${invoiceTotal} ج.م.`);
    }

    localStorage.setItem('soap_customers', JSON.stringify(customers));

    const typeLabel = saleType === 'cash' ? 'كاش (فوري) 💵' : 'أجل ⏱️';
    const fullInvoiceText = `🧾 *فاتورة مبيعات - لوكال برند* 🧼\n---------------------------\n📍 إلى محل: ${cust.name}\n👤 المسؤول: ${cust.owner}\n\n📦 *المنتجات المشتراة:*\n${itemsSummaryText}\n💰 *الإجمالي المستحق:* ${invoiceTotal} ج.م (${typeLabel})\n📌 *إجمالي حسابك الحالي:* ${cust.balance} ج.م\n---------------------------\nشكراً لتعاملكم معنا! 🙏`;

    cart = [];
    renderCart();
    renderPOSProducts();
    loadDashboard();

    if(confirm(`هل تريد إرسال تفاصيل الفاتورة الشاملة لـ ${cust.name} عبر واتساب؟`)) {
        sendWhatsAppCartInvoice(cust, fullInvoiceText);
    }
}

function sendWhatsAppCartInvoice(cust, invoiceText) {
    if(!cust.phone) {
        alert('⚠️ رقم هاتف المحل غير مسجل!');
        return;
    }
    
    let phone = cust.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '20' + phone.substring(1);
    } else if (!phone.startsWith('20') && phone.length === 10) {
        phone = '20' + phone;
    }

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(invoiceText)}`;
    openWhatsAppPrompt(url, cust.name, invoiceText);
}

function openWhatsAppPrompt(whatsappUrl, storeName, messageText) {
    let existingModal = document.getElementById('waRedirectModal');
    if(existingModal) existingModal.remove();

    const modalHtml = `
        <div id="waRedirectModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-center space-y-4">
                <div class="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center text-xl border border-emerald-500/30">
                    <i class="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-white">إرسال الفاتورة عبر واتساب</h3>
                    <p class="text-xs text-slate-400 mt-1">محل: <span class="text-slate-200 font-semibold">${storeName}</span></p>
                </div>
                
                <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-right">
                    <p class="text-[11px] text-slate-300 whitespace-pre-line font-mono max-h-28 overflow-y-auto">${messageText}</p>
                </div>

                <div class="space-y-2 pt-1">
                    <button type="button" onclick="navigator.clipboard.writeText(\`${messageText.replace(/`/g, '\\`')}\`); alert('✅ تم نسخ نص الرسالة بنجاح! الصقها في شات التاجر.');" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg transition">
                        📋 نسخ نص الفاتورة أولاً
                    </button>
                    
                    <a href="${whatsappUrl}" target="_blank" onclick="document.getElementById('waRedirectModal').remove()" class="block w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg transition text-center">
                        🚀 فتح شات الواتساب مباشرة
                    </a>
                    
                    <button type="button" onclick="document.getElementById('waRedirectModal').remove()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 4. تسجيل المصروفات اليومية وصافي الربح (Daily P&L)
document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('expDesc').value;
    const amount = parseFloat(document.getElementById('expAmount').value);
    const todayStr = new Date().toLocaleDateString();

    expenses.push({ desc, amount, date: todayStr });
    localStorage.setItem('soap_expenses', JSON.stringify(expenses));

    alert('✅ تم تسجيل المصروف بنجاح!');
    document.getElementById('expenseForm').reset();
    renderExpenses();
});

function renderExpenses() {
    const list = document.getElementById('expensesList');
    if(!list) return;
    list.innerHTML = '';
    const todayStr = new Date().toLocaleDateString();
    
    const todayExpenses = expenses.filter(e => e.date === todayStr);
    if(todayExpenses.length === 0) {
        list.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">لا توجد مصروفات مسجلة اليوم.</p>';
        return;
    }

    todayExpenses.forEach(ex => {
        list.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-700/50 rounded-xl text-xs mb-1.5">
                <span class="text-slate-200 font-semibold">${ex.desc}</span>
                <span class="text-rose-400 font-bold">-${ex.amount} ج.م</span>
            </div>
        `;
    });
}

// 5. إدارة العملاء والبروفايل
document.getElementById('customerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('storeName').value;
    const owner = document.getElementById('ownerName').value;
    const area = document.getElementById('storeArea').value;
    const phone = document.getElementById('storePhone').value;
    const location = document.getElementById('storeLocation').value;
    const imageInput = document.getElementById('storeImgFile');

    let defaultImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (uploadEvent) {
            saveNewCustomer(name, owner, area, phone, location, uploadEvent.target.result);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveNewCustomer(name, owner, area, phone, location, defaultImg);
    }
});

function saveNewCustomer(name, owner, area, phone, location, img) {
    customers.push({ id: Date.now(), name, owner, area, phone, location, img, balance: 0, history: [] });
    localStorage.setItem('soap_customers', JSON.stringify(customers));
    alert('🎉 تم إضافة المحل بنجاح!');
    document.getElementById('customerForm').reset();
    renderCustomers();
}

function renderCustomers() {
    const list = document.getElementById('customersList');
    if(!list) return;
    list.innerHTML = '';
    if(customers.length === 0) {
        list.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">لا توجد محلات مسجلة بعد.</p>';
        return;
    }
    customers.forEach(c => {
        list.innerHTML += `
            <div onclick="openCustomerProfile(${c.id})" class="flex justify-between items-center p-3 bg-slate-900 border border-slate-700/60 rounded-xl cursor-pointer hover:border-emerald-500 transition mb-2">
                <div class="flex items-center gap-3">
                    <img src="${c.img}" class="w-14 h-14 object-cover rounded-xl border border-slate-700 shadow flex-shrink-0">
                    <div>
                        <p class="font-bold text-slate-200 text-sm">${c.name} <span class="text-xs text-slate-400">(${c.area})</span></p>
                        <p class="text-xs text-slate-400">المسؤول: ${c.owner}</p>
                        <p class="text-xs text-rose-400 font-semibold">متبقي عليه: ${c.balance} ج.م</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-left text-slate-500 text-xs"></i>
            </div>
        `;
    });
}

function openCustomerProfile(id) {
    const c = customers.find(item => item.id == id);
    if(!c) return;

    document.getElementById('customersMainView').classList.add('hidden');
    document.getElementById('customerProfileView').classList.remove('hidden');

    let historyHtml = c.history && c.history.length > 0 ? c.history.map(h => `
        <div class="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-700/50 rounded-xl text-xs mb-1.5">
            <div>
                <span class="font-bold ${h.type === 'sale' ? 'text-indigo-400' : 'text-teal-400'}">${h.type === 'sale' ? '🛒 شراء بضاعة' : '💵 سداد دفعة'}</span>
                <p class="text-slate-300 mt-0.5">${h.details}</p>
                <span class="text-[10px] text-slate-500">${h.date}</span>
            </div>
            <span class="font-bold ${h.type === 'sale' ? 'text-rose-400' : 'text-emerald-400'}">${h.type === 'sale' ? '+' : '-'}${h.amount} ج.م</span>
        </div>
    `).join('') : '<p class="text-xs text-slate-500 text-center py-3">لا توجد حركات مسجلة حتى الآن.</p>';

    document.getElementById('profileContent').innerHTML = `
        <div class="bg-slate-800/90 border border-slate-700/60 p-4 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <img src="${c.img}" class="w-24 h-24 object-cover rounded-2xl border-2 border-slate-700 shadow-md mb-3">
            <h2 class="font-bold text-lg text-white">${c.name}</h2>
            <p class="text-xs text-slate-400">صاحب المحل: <span class="text-slate-200 font-semibold">${c.owner}</span></p>
            <p class="text-xs text-slate-400 mt-0.5">المنطقة: ${c.area}</p>
            
            <div class="flex gap-2 mt-3 w-full">
                ${c.phone ? `<a href="tel:${c.phone}" class="flex-1 bg-brand-600/20 text-brand-400 border border-brand-500/30 py-2 rounded-xl text-xs font-bold text-center"><i class="fa-solid fa-phone"></i> اتصال</a>` : ''}
                ${c.location ? `<a href="${c.location}" target="_blank" class="flex-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2 rounded-xl text-xs font-bold text-center"><i class="fa-solid fa-map-location-dot"></i> اللوكيشن</a>` : ''}
                ${c.phone ? `<button type="button" onclick="sendWhatsAppProfile(${c.id})" class="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl text-xs font-bold"><i class="fa-brands fa-whatsapp"></i> واتساب</button>` : ''}
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-800/90 border border-slate-700/60 p-3 rounded-2xl text-center">
                <span class="text-[11px] text-slate-400 block">إجمالي المديونية الحالية</span>
                <span class="text-base font-bold text-rose-400">${c.balance} ج.م</span>
            </div>
            <div class="bg-slate-800/90 border border-slate-700/60 p-3 rounded-2xl text-center">
                <span class="text-[11px] text-slate-400 block">عدد الحركات</span>
                <span class="text-base font-bold text-indigo-400">${c.history ? c.history.length : 0}</span>
            </div>
        </div>

        <div class="bg-slate-800/90 border border-slate-700/60 p-4 rounded-2xl shadow-xl space-y-2">
            <h3 class="font-bold text-xs text-slate-300 mb-2">سجل حركات المحل</h3>
            <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                ${historyHtml}
            </div>
        </div>
    `;
}

function backToCustomersList() {
    document.getElementById('customerProfileView')?.classList.add('hidden');
    document.getElementById('customersMainView')?.classList.remove('hidden');
    renderCustomers();
}

// 6. التحصيل والسداد
function loadDebtorsDropdown() {
    const select = document.getElementById('collectionCustomerSelect');
    if(!select) return;
    select.innerHTML = '<option value="">اختر المحل...</option>';
    customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name} (${c.area}) - متبقي: ${c.balance} ج.م</option>`;
    });
}

document.getElementById('collectionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const customerId = document.getElementById('collectionCustomerSelect').value;
    const amountPaid = parseFloat(document.getElementById('collectionAmount').value);

    let cust = customers.find(c => c.id == customerId);
    if(cust) {
        if(amountPaid > cust.balance) {
            alert('⚠️ المبلغ المدفوع أكبر من إجمالي مديونية المحل!');
            return;
        }
        
        cust.balance -= amountPaid;
        if(!cust.history) cust.history = [];
        cust.history.unshift({
            type: 'collection',
            details: `سداد نقدية`,
            amount: amountPaid,
            date: new Date().toLocaleString()
        });

        localStorage.setItem('soap_customers', JSON.stringify(customers));
        collections.push({ customerId, amount: amountPaid, date: new Date().toLocaleDateString() });
        localStorage.setItem('soap_collections', JSON.stringify(collections));

        alert(`✅ تم تسجيل سداد بقيمة ${amountPaid} ج.م بنجاح!`);
        document.getElementById('collectionForm').reset();
        loadDebtorsDropdown();
    }
});

function sendWhatsAppProfile(id) {
    const cust = customers.find(c => c.id == id);
    if(!cust || !cust.phone) {
        alert('⚠️ رقم هاتف المحل غير مسجل!');
        return;
    }

    let phone = cust.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '20' + phone.substring(1);
    } else if (!phone.startsWith('20') && phone.length === 10) {
        phone = '20' + phone;
    }

    const msg = `مرحباً يا فندم (${cust.name})، إجمالي حسابك لدى لوكال برند للصابون هو: ${cust.balance} ج.م. برجاء التسوية قريباً، شكراً لك! 🙏`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    
    openWhatsAppPrompt(url, cust.name, msg);
}

// 7. الداشبورد وحساب صافي الربح اليومي (P&L)
function loadDashboard() {
    let totalDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    const debtEl = document.getElementById('dashTotalDebt');
    if(debtEl) debtEl.innerText = `${totalDebt} ج.م`;

    let totalCollected = collections.reduce((sum, col) => sum + col.amount, 0);
    const collEl = document.getElementById('dashTotalCollected');
    if(collEl) collEl.innerText = `${totalCollected} ج.م`;

    const todayStr = new Date().toLocaleDateString();
    let todaySalesTotal = sales.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.total, 0);
    let todayExpensesTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
    let netDailyProfit = todaySalesTotal - todayExpensesTotal;

    const netProfitEl = document.getElementById('dashNetProfit');
    if(netProfitEl) netProfitEl.innerText = `${netDailyProfit} ج.م`;

    const reminders = document.getElementById('dashReminders');
    if(!reminders) return;
    const debtors = customers.filter(c => c.balance > 0);
    if(debtors.length === 0) {
        reminders.innerHTML = '<p class="text-emerald-400">ممتاز! لا توجد مديونيات متأخرة.</p>';
    } else {
        reminders.innerHTML = debtors.map(d => `
            <div class="p-2 bg-rose-500/10 border-r-2 border-rose-500 rounded text-rose-300 flex justify-between items-center mb-1">
                <span>محل ${d.name} (${d.area})</span>
                <span class="font-bold">${d.balance} ج.م</span>
            </div>
        `).join('');
    }
}

// 8. ميزة النسخ الاحتياطي والاستعادة (Backup & Restore)
function backupData() {
    const backupObj = {
        products: JSON.parse(localStorage.getItem('soap_products')) || [],
        customers: JSON.parse(localStorage.getItem('soap_customers')) || [],
        sales: JSON.parse(localStorage.getItem('soap_sales')) || [],
        collections: JSON.parse(localStorage.getItem('soap_collections')) || [],
        expenses: JSON.parse(localStorage.getItem('soap_expenses')) || []
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `local_brand_backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('✅ تم تحميل النسخة الاحتياطية بنجاح على جهازك!');
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = JSON.parse(e.target.result);
            
            if (content.products) localStorage.setItem('soap_products', JSON.stringify(content.products));
            if (content.customers) localStorage.setItem('soap_customers', JSON.stringify(content.customers));
            if (content.sales) localStorage.setItem('soap_sales', JSON.stringify(content.sales));
            if (content.collections) localStorage.setItem('soap_collections', JSON.stringify(content.collections));
            if (content.expenses) localStorage.setItem('soap_expenses', JSON.stringify(content.expenses));

            alert('🎉 تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة الآن.');
            location.reload();
        } catch (error) {
            alert('❌ الملف غير صالح أو تالف! تأكد من اختيار ملف نسخ احتياطي صحيح.');
        }
    };
    reader.readAsText(file);
}

// التشغيل الأولي
loadDashboard();
renderCustomers();