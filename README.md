# Temiz Dil API

Temiz Dil API, Türkçe metinlerdeki saldırgan içerikleri tespit etmek için geliştirilmiş bir hizmettir. Bu API, makine öğrenimi tabanlı bir model kullanarak metinleri analiz eder ve içerik türünü kategorize eder.

## Özellikler

- **Saldırgan İçerik Tespiti**: Metinlerin saldırgan olup olmadığını algılar
- **Hedef Analizi**: Saldırgan içeriğin hedefini tespit eder (grup, birey, diğer)
- **Kategorizasyon**: Metinleri farklı saldırganlık kategorilerine ayırır
- **API Anahtarı Yönetimi**: Erişim kontrolü ve kullanım limitleri için API anahtarları
- **IP Tabanlı Kısıtlamalar**: IP bazlı rate limiting ve kullanım takibi
- **Admin Paneli**: Sistem yönetimi için kapsamlı bir yönetici arayüzü
- **Kullanım İstatistikleri**: API kullanımını takip etmek için detaylı raporlar

## Kurulum

### Gereksinimler

- Python 3.7 veya üstü
- MySQL / MariaDB veritabanı
- PyTorch
- Flask

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullaniciadi/temizdil.git
cd temizdil
```

2. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

3. `.env` dosyasını oluşturun:
```
DB_HOST=localhost
DB_USER=kullaniciadi
DB_PASSWORD=sifre
DB_NAME=temizdil_api
SECRET_KEY=gizli_anahtar
ADMIN_PASSWORD=admin_sifresi
```

4. Veritabanını oluşturun:
```bash
mysql -u root -p
CREATE DATABASE temizdil_api;
```

5. API'yi başlatın:
```bash
python api_service.py --host 0.0.0.0 --port 5000
```

## Kullanım

### API Endpoint'leri

#### Saldırgan İçerik Analizi

```
POST /predict
```

**İstek Örneği:**
```json
{
  "text": "Analiz edilecek Türkçe metin"
}
```

**Yanıt Örneği:**
```json
{
  "is_offensive": true,
  "predicted_labels": ["prof"],
  "label_probabilities": {
    "non": 0.05,
    "prof": 0.85,
    "grp": 0.03,
    "ind": 0.04,
    "oth": 0.03
  },
  "is_difficult": false,
  "is_targeted": true,
  "target_type": "birey",
  "text": "Analiz edilecek Türkçe metin",
  "usage_info": {
    "tokens_used": 5,
    "tokens_remaining": 9995,
    "unlimited": false,
    "using_api_key": true
  }
}
```

#### Toplu Analiz

```
POST /batch_predict
```

**İstek Örneği:**
```json
{
  "texts": ["Birinci metin", "İkinci metin", "Üçüncü metin"]
}
```

#### Kullanım Bilgisi

```
GET /usage_info
```

### API Anahtarı Kullanımı

API'yi çağırırken, isteğinizde bir API anahtarı sağlayabilirsiniz:

```
curl -X POST "http://api.example.com/predict" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sizin_api_anahtariniz" \
     -d '{"text": "Analiz edilecek metin"}'
```

### İstek Limitleri

- IP başına dakikada 10 istek
- API anahtarları için aylık token limiti (varsayılan: 100,000)
- IP adresleri için aylık token limiti (varsayılan: 10,000)

## Admin Paneli

Admin paneline erişmek için:

1. `/admin` adresine gidin
2. Admin şifresini girin (`.env` dosyasında ayarlanmış)

### Admin Paneli Özellikleri

- **API Anahtarı Yönetimi**: Yeni anahtarlar oluşturma, mevcut anahtarları düzenleme ve silme
- **IP Kullanımı**: IP bazlı kullanım istatistiklerini görüntüleme ve limitleri sıfırlama
- **Kullanım Özeti**: Genel API kullanımı hakkında istatistikler
- **Admin API**: Programlama yoluyla admin işlemlerini gerçekleştirme

## Etiket Açıklamaları

- **non**: Saldırgan olmayan içerik
- **prof**: Müstehcen/küfürlü içerik
- **grp**: Grup bazlı saldırganlık (ırk, cinsiyet, din vb.)
- **ind**: Bireysel saldırganlık
- **oth**: Diğer saldırganlık türleri

## Teknik Detaylar

### Mimari

- **API Servisi**: Flask kullanılarak geliştirilmiş RESTful API
- **Model**: PyTorch ile eğitilmiş saldırgan içerik tespit modeli
- **Veritabanı**: MySQL/MariaDB ile kullanıcı ve kullanım verileri yönetimi
- **Frontend**: HTML, CSS (Tailwind) ve JavaScript ile geliştirilen yönetici arayüzü

### Güvenlik Özellikleri

- API anahtarları ile erişim kontrolü
- IP bazlı rate limiting
- Admin arayüzü için şifre koruması
- Token tabanlı yetkilendirme

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## İletişim

Sorularınız veya önerileriniz için [email@example.com](mailto:email@example.com) adresine e-posta gönderebilirsiniz. 