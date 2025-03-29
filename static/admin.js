document.addEventListener('DOMContentLoaded', function() {
    // Tab değiştirme
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Aktif tab butonunu güncelle
            tabButtons.forEach(btn => {
                btn.classList.remove('border-blue-600', 'text-blue-600');
                btn.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
                btn.setAttribute('aria-selected', 'false');
            });
            
            this.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            this.classList.add('border-blue-600', 'text-blue-600');
            this.setAttribute('aria-selected', 'true');
            
            // Tab içeriklerini güncelle
            const target = this.dataset.target;
            
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            document.getElementById(target).classList.remove('hidden');
            
            // İlgili veriyi yükle
            if (target === 'apiKeysContent' && !this.dataset.loaded) {
                loadApiKeys();
                this.dataset.loaded = 'true';
            } else if (target === 'ipUsageContent' && !this.dataset.loaded) {
                loadIpUsage();
                this.dataset.loaded = 'true';
            } else if (target === 'usageSummaryContent' && !this.dataset.loaded) {
                loadUsageSummary();
                this.dataset.loaded = 'true';
            } else if (target === 'endpointsContent') {
                // Endpoints içeriği statik olduğu için yükleme yapmıyoruz
                this.dataset.loaded = 'true';
            }
        });
    });

    // Sayfa yüklendiğinde ilk tabı seç
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    // API Key Modal işlemleri
    const createApiKeyBtn = document.getElementById('createApiKeyBtn');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const apiKeyForm = document.getElementById('apiKeyForm');
    const apiKeyModalTitle = document.getElementById('apiKeyModalTitle');
    const submitApiKeyBtn = document.getElementById('submitApiKeyBtn');

    // Yeni API anahtarı butonuna tıklandığında modal'ı aç (oluşturma modu)
    createApiKeyBtn.addEventListener('click', function() {
        // Formu sıfırla
        apiKeyForm.reset();
        document.getElementById('keyId').value = '';
        document.getElementById('editMode').value = '0';
        document.getElementById('autoReset').checked = true;
        
        // Modal başlığını ve buton yazısını ayarla
        apiKeyModalTitle.textContent = 'Yeni API Anahtarı Oluştur';
        submitApiKeyBtn.textContent = 'Oluştur';
        
        // Modal'ı aç
        apiKeyModal.classList.remove('hidden');
        apiKeyModal.classList.add('flex');
    });

    // Modal kapatma işlemleri
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Form gönderimi
    apiKeyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const editMode = document.getElementById('editMode').value === '1';
        
        if (editMode) {
            updateApiKey();
        } else {
            createApiKey();
        }
    });

    // Admin giriş işlemi
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Form POST işlemi tarayıcı tarafından yönetilecek
            this.submit();
        });
    }

    // Dark mode için kod bloklarındaki arka plan renklerini düzenle
    const codeBlocks = document.querySelectorAll('code');
    if (codeBlocks.length > 0) {
        const darkModeObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (document.body.classList.contains('dark-mode')) {
                        codeBlocks.forEach(block => {
                            block.classList.remove('bg-gray-100');
                            block.classList.add('bg-gray-800', 'text-gray-200');
                        });
                    } else {
                        codeBlocks.forEach(block => {
                            block.classList.remove('bg-gray-800', 'text-gray-200');
                            block.classList.add('bg-gray-100');
                        });
                    }
                }
            });
        });
        
        darkModeObserver.observe(document.body, { attributes: true });
        
        // Sayfa ilk yüklendiğinde dark mode kontrolü
        if (document.body.classList.contains('dark-mode')) {
            codeBlocks.forEach(block => {
                block.classList.remove('bg-gray-100');
                block.classList.add('bg-gray-800', 'text-gray-200');
            });
        }
    }
});

// Modal'ı kapat
function closeModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Tarih formatlama yardımcı fonksiyonu
function formatDate(dateStr) {
    if (!dateStr) return '-';
    
    try {
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleString('tr-TR', {
            timeZone: 'UTC' // Zaman dilimini UTC olarak sabitler
        });
    } catch (e) {
        console.error('Tarih formatlanırken hata:', e);
        return '-';
    }
}

// API isteği yapmak için ortak fonksiyon
function fetchAPI(url, options = {}) {
    // Varsayılan ayarları belirle
    const defaultOptions = {
        headers: {
            'Accept': 'application/json'
        }
    };
    
    // Seçenekleri birleştir
    const fetchOptions = {...defaultOptions, ...options};
    
    // Content-Type header'ı ekle (eğer body varsa ve Content-Type yoksa)
    if (options.body && !options.headers?.['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }
    
    // İsteği yap
    return fetch(url, fetchOptions)
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/admin?error=401';
                throw new Error('Yetkisiz erişim');
            }
            return response.json();
        });
}

// API anahtarlarını yükle
function loadApiKeys() {
    const contentArea = document.querySelector('#apiKeysContent .p-6');
    contentArea.innerHTML = '<p class="text-gray-600 mb-4">Yükleniyor...</p>';
    
    fetchAPI('/admin/list_api_keys')
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">${data.error}</div>`;
                return;
            }
            
            if (!data.api_keys || data.api_keys.length === 0) {
                contentArea.innerHTML = '<p class="text-gray-600 mb-4">Henüz API anahtarı bulunmuyor.</p>';
                return;
            }
            
            let html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Anahtarı</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sınırsız</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aylık Limit</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanılan</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Otomatik Reset</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Reset</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            data.api_keys.forEach(key => {
                const lastResetDate = formatDate(key.last_reset_date);
                
                html += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">${key.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap"><code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-800 dark:text-gray-300">${key.api_key}</code></td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${key.description || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${key.is_unlimited ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Evet</span>' : '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Hayır</span>'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${key.monthly_token_limit.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${key.tokens_used.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${key.auto_reset ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Evet</span>' : '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Hayır</span>'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastResetDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(key.created_at)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="getApiKeyDetails(${key.id})" class="text-gray-600 hover:text-gray-900 mr-2">Detay</button>
                            <button onclick="editApiKey(${key.id})" class="text-blue-600 hover:text-blue-900 mr-2">Düzenle</button>
                            <button onclick="deleteApiKey(${key.id})" class="text-red-600 hover:text-red-900 mr-2">Sil</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            contentArea.innerHTML = html;
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarları yüklenirken hata:', error);
                contentArea.innerHTML = '<div class="p-4 bg-red-100 text-red-700 rounded-lg">API anahtarları yüklenirken bir hata oluştu.</div>';
            }
        });
}

// IP kullanımını yükle
function loadIpUsage() {
    const ipUsageContent = document.getElementById('ipUsageContent');
    if (!ipUsageContent) return;
    
    const contentArea = ipUsageContent.querySelector('.p-6');
    if (!contentArea) return;
    
    // Spinner göster
    contentArea.innerHTML = `
        <div class="flex justify-center p-4">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    `;
    
    fetchAPI('/admin/list_ip_usage')
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">${data.error}</div>`;
                return;
            }
            
            if (!data.ip_usage || data.ip_usage.length === 0) {
                contentArea.innerHTML = '<div class="p-4 bg-blue-100 text-blue-700 rounded-lg">Henüz IP kullanım bilgisi bulunmuyor.</div>';
                return;
            }
            
            // IP kullanım tablosu oluştur
            let html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Adresi</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Limiti</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanılan</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İstek Sayısı</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son İstek</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Resetleme</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            data.ip_usage.forEach(ip => {
                let lastResetDate = formatDate(ip.last_reset_date);
                
                html += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ip.ip_address}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ip.monthly_token_limit.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ip.tokens_used.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ip.request_count.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(ip.last_request_time)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastResetDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="resetIpLimits('${ip.ip_address}')" class="text-yellow-600 hover:text-yellow-900 mr-2">Sıfırla</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            contentArea.innerHTML = html;
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('IP kullanım bilgileri yüklenirken hata:', error);
                contentArea.innerHTML = '<div class="p-4 bg-red-100 text-red-700 rounded-lg">IP kullanım bilgileri yüklenirken bir hata oluştu.</div>';
            }
        });
}

// Kullanım özetini yükle
function loadUsageSummary() {
    const usageSummaryContent = document.getElementById('usageSummaryContent');
    if (!usageSummaryContent) return;
    
    const contentArea = usageSummaryContent.querySelector('.p-6');
    if (!contentArea) return;
    
    // Spinner göster
    contentArea.innerHTML = `
        <div class="flex justify-center p-4">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    `;
    
    fetchAPI('/admin/usage_summary')
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">${data.error}</div>`;
                return;
            }
            
            // Genel istatistikler kartı
            let html = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h4 class="text-lg font-medium text-dark">Genel İstatistikler</h4>
                        </div>
                        <div class="p-6">
                            <ul class="divide-y divide-gray-200">
                                <li class="py-3 flex justify-between">
                                    <span class="text-gray-600">Toplam API Anahtarı</span>
                                    <span class="font-medium text-gray-900">${data.total_api_keys}</span>
                                </li>
                                <li class="py-3 flex justify-between">
                                    <span class="text-gray-600">Toplam IP Adresi</span>
                                    <span class="font-medium text-gray-900">${data.total_ips}</span>
                                </li>
                                <li class="py-3 flex justify-between">
                                    <span class="text-gray-600">Bugünkü İstek Sayısı</span>
                                    <span class="font-medium text-green-600">${data.today_requests}</span>
                                </li>
                                <li class="py-3 flex justify-between">
                                    <span class="text-gray-600">Son 30 Gündeki İstek Sayısı</span>
                                    <span class="font-medium text-blue-600">${data.monthly_requests}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
            `;
            
            // En çok kullanılan API anahtarları
            if (data.top_api_keys && data.top_api_keys.length > 0) {
                html += `
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h4 class="text-lg font-medium text-dark">En Çok Kullanılan API Anahtarları</h4>
                        </div>
                        <div class="p-6">
                            <ul class="divide-y divide-gray-200">
                `;
                
                data.top_api_keys.forEach(key => {
                    html += `
                        <li class="py-3 flex justify-between">
                            <span class="text-gray-600">API Key ID: ${key.api_key_id}</span>
                            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">${key.usage_count} istek</span>
                        </li>
                    `;
                });
                
                html += `
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            // En çok kullanılan IP adresleri
            if (data.top_ips && data.top_ips.length > 0) {
                html += `
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h4 class="text-lg font-medium text-dark">En Çok Kullanılan IP Adresleri</h4>
                        </div>
                        <div class="p-6">
                            <ul class="divide-y divide-gray-200">
                `;
                
                data.top_ips.forEach(ip => {
                    html += `
                        <li class="py-3 flex justify-between">
                            <span class="text-gray-600">${ip.request_ip}</span>
                            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">${ip.usage_count} istek</span>
                        </li>
                    `;
                });
                
                html += `
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            html += `</div>`;
            
            contentArea.innerHTML = html;
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('Kullanım özeti yüklenirken hata:', error);
                contentArea.innerHTML = '<div class="p-4 bg-red-100 text-red-700 rounded-lg">Kullanım özeti yüklenirken bir hata oluştu.</div>';
            }
        });
}

// API anahtarı sil
function deleteApiKey(keyId) {
    if (!confirm(`${keyId} ID'li API anahtarını silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    fetchAPI(`/admin/delete_api_key/${keyId}`, {
        method: 'DELETE'
    })
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
            } else {
                alert(data.message || 'API anahtarı başarıyla silindi.');
                loadApiKeys();
            }
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarı silinirken hata:', error);
                alert('API anahtarı silinirken bir hata oluştu.');
            }
        });
}

// IP limitlerini sıfırla
function resetIpLimits(ipAddress) {
    if (!confirm(`${ipAddress} IP adresinin kullanım limitlerini sıfırlamak istediğinizden emin misiniz?`)) {
        return;
    }
    
    fetchAPI(`/admin/reset_ip_limits/${ipAddress}`, {
        method: 'POST'
    })
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
            } else {
                alert(data.message || 'IP limitleri başarıyla sıfırlandı.');
                loadIpUsage();
            }
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('IP limitleri sıfırlanırken hata:', error);
                alert('IP limitleri sıfırlanırken bir hata oluştu.');
            }
        });
}

// Yeni API anahtarı oluştur
function createApiKey() {
    const description = document.getElementById('keyDescription').value;
    const monthlyLimit = parseInt(document.getElementById('monthlyLimit').value) || 100000;
    const isUnlimited = document.getElementById('isUnlimited').checked;
    const autoReset = document.getElementById('autoReset').checked;
    
    fetchAPI('/admin/create_api_key', {
        method: 'POST',
        body: JSON.stringify({
            description,
            monthly_token_limit: monthlyLimit,
            is_unlimited: isUnlimited,
            auto_reset: autoReset
        })
    })
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
            } else {
                alert(`API anahtarı başarıyla oluşturuldu: ${data.api_key}`);
                
                // Formu temizle ve modal'ı kapat
                closeModal();
                
                // Tabloyu yenile
                loadApiKeys();
            }
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarı oluşturulurken hata:', error);
                alert('API anahtarı oluşturulurken bir hata oluştu.');
            }
        });
}

// API anahtarını düzenle - Modal'ı aç
function editApiKey(keyId) {
    // Mevcut API anahtarı bilgilerini getir
    fetchAPI(`/admin/get_api_key/${keyId}`)
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
                return;
            }
            
            // API anahtarı bilgilerini al
            const apiKey = data.api_key;
            
            // Düzenleme modunda modal'ı aç
            const apiKeyModal = document.getElementById('apiKeyModal');
            const apiKeyModalTitle = document.getElementById('apiKeyModalTitle');
            const submitApiKeyBtn = document.getElementById('submitApiKeyBtn');
            
            // Form alanlarını doldur
            document.getElementById('keyId').value = apiKey.id;
            document.getElementById('editMode').value = '1';
            document.getElementById('keyDescription').value = apiKey.description || '';
            document.getElementById('monthlyLimit').value = apiKey.monthly_token_limit;
            document.getElementById('isUnlimited').checked = apiKey.is_unlimited;
            document.getElementById('autoReset').checked = apiKey.auto_reset;
            
            // Modal başlığını ve buton yazısını ayarla
            apiKeyModalTitle.textContent = 'API Anahtarı Düzenle';
            submitApiKeyBtn.textContent = 'Güncelle';
            
            // Modal'ı aç
            apiKeyModal.classList.remove('hidden');
            apiKeyModal.classList.add('flex');
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarı bilgileri alınırken hata:', error);
                alert('API anahtarı bilgileri alınırken bir hata oluştu.');
            }
        });
}

// API anahtarını güncelle
function updateApiKey() {
    const keyId = document.getElementById('keyId').value;
    const description = document.getElementById('keyDescription').value;
    const monthlyLimit = parseInt(document.getElementById('monthlyLimit').value) || 100000;
    const isUnlimited = document.getElementById('isUnlimited').checked;
    const autoReset = document.getElementById('autoReset').checked;
    
    const requestData = {
        description,
        monthly_token_limit: monthlyLimit,
        is_unlimited: isUnlimited,
        auto_reset: autoReset
    };    
   
    fetchAPI(`/admin/update_api_key/${keyId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData)
    })
        .then(data => {       
            if (data.error) {
                alert(`Hata: ${data.error}`);
            } else {
                alert(data.message || 'API anahtarı başarıyla güncellendi.');
                
                // Modal'ı kapat
                closeModal();
                
                // Tabloyu yenile
                loadApiKeys();
            }
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarı güncellenirken hata:', error);
                alert('API anahtarı güncellenirken bir hata oluştu.');
            }
        });
}

// API anahtarı bilgilerini getir
function getApiKeyDetails(keyId) {
    fetchAPI(`/admin/get_api_key/${keyId}`)
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
                return;
            }
            
            const apiKey = data.api_key;
            
            // Modal içeriğini oluştur
            let modalHtml = `
                <div id="apiKeyDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg max-w-md w-full m-4">
                        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="text-xl font-semibold text-dark">API Anahtarı Detayları</h3>
                            <button id="closeDetailsModalBtn" class="text-gray-500 hover:text-gray-700">&times;</button>
                        </div>
                        <div class="p-6">
                            <div class="mb-4">
                                <h4 class="text-md font-medium text-gray-700 mb-2">API Anahtarı:</h4>
                                <div class="flex items-center">
                                    <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-800 dark:text-gray-300 flex-grow">${apiKey.api_key}</code>
                                    <button class="ml-2 text-blue-600 hover:text-blue-800" onclick="copyToClipboard('${apiKey.api_key}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="space-y-3 mt-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">ID:</div>
                                    <div class="font-medium">${apiKey.id}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Açıklama:</div>
                                    <div class="font-medium">${apiKey.description || '-'}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Sınırsız:</div>
                                    <div class="font-medium">${apiKey.is_unlimited ? 'Evet' : 'Hayır'}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Aylık Token Limiti:</div>
                                    <div class="font-medium">${apiKey.monthly_token_limit.toLocaleString()}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Kullanılan Tokenler:</div>
                                    <div class="font-medium">${apiKey.tokens_used.toLocaleString()}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Otomatik Sıfırlama:</div>
                                    <div class="font-medium">${apiKey.auto_reset ? 'Evet' : 'Hayır'}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Son Sıfırlama:</div>
                                    <div class="font-medium">${formatDate(apiKey.last_reset_date)}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Oluşturulma Tarihi:</div>
                                    <div class="font-medium">${formatDate(apiKey.created_at)}</div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="text-gray-600">Son Güncelleme:</div>
                                    <div class="font-medium">${formatDate(apiKey.updated_at)}</div>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-2 mt-6">
                                <button type="button" id="closeDetailsBtn" class="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2">Kapat</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Modal'ı sayfaya ekle
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Kapanış butonları için olay dinleyicileri
            document.getElementById('closeDetailsModalBtn').addEventListener('click', closeDetailsModal);
            document.getElementById('closeDetailsBtn').addEventListener('click', closeDetailsModal);
        })
        .catch(error => {
            if (error.message !== 'Yetkisiz erişim') {
                console.error('API anahtarı bilgileri alınırken hata:', error);
                alert('API anahtarı bilgileri alınırken bir hata oluştu.');
            }
        });
}

// Detay modalını kapat
function closeDetailsModal() {
    const modal = document.getElementById('apiKeyDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Panoya kopyala
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('API anahtarı panoya kopyalandı!');
        })
        .catch(err => {
            console.error('Kopyalama başarısız:', err);
            alert('Kopyalama işlemi başarısız oldu. Lütfen manuel olarak kopyalayın.');
        });
}