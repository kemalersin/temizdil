document.addEventListener('DOMContentLoaded', function() {
    // Kod örnekleri için seçici
    const codeBlocks = document.querySelectorAll('.code-block');
    
    // Her bir kod bloğu için kopyalama butonu ekle
    codeBlocks.forEach(function(block, index) {
        // Kapsayıcı div oluştur
        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        wrapper.style.position = 'relative';
        
        // Blok kopyası oluştur
        const clone = block.cloneNode(true);
        
        // Kopyalama butonu oluştur
        const copyButton = document.createElement('button');
        copyButton.innerHTML = 'Kopyala';
        copyButton.className = 'bg-gray-700 text-white text-xs px-2 py-1 rounded';
        copyButton.style.position = 'absolute';
        copyButton.style.top = '5px';
        copyButton.style.right = '5px';
        copyButton.style.opacity = '0.7';
        copyButton.style.zIndex = '10';
        
        // Tıklama olayı ekle
        copyButton.addEventListener('click', function() {
            // Kod içeriğini al (sadece metin)
            const code = block.querySelector('code').innerText;
            
            // Kopyalama işlemi
            navigator.clipboard.writeText(code).then(function() {
                copyButton.innerHTML = 'Kopyalandı!';
                setTimeout(function() {
                    copyButton.innerHTML = 'Kopyala';
                }, 2000);
            }).catch(function(err) {
                console.error('Kopyalama başarısız: ', err);
            });
        });
        
        // Blok yerine wrapper ekle
        block.parentNode.replaceChild(wrapper, block);
        
        // Wrapper içine klon ve butonu ekle
        wrapper.appendChild(clone);
        wrapper.appendChild(copyButton);
    });
    
    // Basit API durumu kontrolü
    const checkAPIStatus = function() {
        fetch('/health')
            .then(response => response.json())
            .then(data => {
                const statusIndicator = document.querySelector('.status-indicator');
                const statusText = document.querySelector('.status-text');
                
                if (data.status === 'healthy') {
                    statusIndicator.className = 'status-indicator status-ok';
                    statusText.textContent = 'Çalışıyor';
                } else {
                    statusIndicator.className = 'status-indicator status-error';
                    statusText.textContent = 'Hata';
                }
            })
            .catch(() => {
                const statusIndicator = document.querySelector('.status-indicator');
                const statusText = document.querySelector('.status-text');
                
                statusIndicator.className = 'status-indicator status-error';
                statusText.textContent = 'Bağlantı Hatası';
            });
    };
    
    // Sayfa yüklendiğinde API durumunu kontrol et
    checkAPIStatus();
    
    // Test alanı için bir kod bloğu
    const testArea = document.getElementById('test-area');
    if (testArea) {
        const testButton = document.getElementById('test-button');
        const resultArea = document.getElementById('result-area');
        
        testButton.addEventListener('click', function() {
            const text = document.getElementById('test-text').value;
            
            if (text.trim() === '') {
                resultArea.innerHTML = '<div class="p-4 bg-yellow-100 text-yellow-700 rounded-lg">Lütfen bir metin girin</div>';
                return;
            }
            
            resultArea.innerHTML = '<div class="flex justify-center"><svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';
            
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            };
            
            fetch('/predict', fetchOptions)
            .then(response => response.json())
            .then(data => {
                let resultHtml = '<pre class="code-block"><code>' + JSON.stringify(data, null, 2) + '</code></pre>';
                resultArea.innerHTML = resultHtml;
                
                // Yeni eklenen kod bloğuna kopyalama butonu ekle
                const newCodeBlock = resultArea.querySelector('.code-block');
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                wrapper.style.position = 'relative';
                
                const clone = newCodeBlock.cloneNode(true);
                
                const copyButton = document.createElement('button');
                copyButton.innerHTML = 'Kopyala';
                copyButton.className = 'bg-gray-700 text-white text-xs px-2 py-1 rounded';
                copyButton.style.position = 'absolute';
                copyButton.style.top = '5px';
                copyButton.style.right = '5px';
                copyButton.style.opacity = '0.7';
                copyButton.style.zIndex = '10';
                
                copyButton.addEventListener('click', function() {
                    const code = clone.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(function() {
                        copyButton.innerHTML = 'Kopyalandı!';
                        setTimeout(function() {
                            copyButton.innerHTML = 'Kopyala';
                        }, 2000);
                    }).catch(function(err) {
                        console.error('Kopyalama başarısız: ', err);
                    });
                });
                
                newCodeBlock.parentNode.replaceChild(wrapper, newCodeBlock);
                wrapper.appendChild(clone);
                wrapper.appendChild(copyButton);
            })
            .catch(error => {
                resultArea.innerHTML = '<div class="p-4 bg-red-100 text-red-700 rounded-lg">Hata: ' + error.message + '</div>';
            });
        });
    }   
}); 