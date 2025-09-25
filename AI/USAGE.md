# Hướng dẫn sử dụng ATHENA AI Analysis

## Khởi chạy ứng dụng

### Cách 1: Sử dụng script tự động
```bash
# Chạy file start.bat (Windows)
start.bat
```

### Cách 2: Chạy thủ công
```bash
# Cài đặt dependencies
pnpm install

# Chạy development server
pnpm dev
```

Sau khi chạy thành công, mở trình duyệt và truy cập: `http://localhost:3000`

## Cách sử dụng giao diện

### 1. Trang chính
- Hiển thị thống kê tổng quan về người dùng
- Cây phân tích với node gốc "Phân tích thành phần người dùng"
- 3 thẻ thống kê: Tổng người dùng, Người dùng hoạt động, Tỷ lệ chuyển đổi

### 2. Tương tác với cây phân tích

#### Mở rộng/thu gọn node
- Click vào mũi tên (▶️/🔽) bên cạnh node để mở rộng/thu gọn
- Node gốc có 2 node con: "Phân tích tất cả người dùng" và "Phân tích người dùng cụ thể"

#### Phân tích dữ liệu
1. Click nút **"Phân tích"** trên bất kỳ node nào
2. Hệ thống sẽ gọi API Gemini AI để phân tích dữ liệu
3. Kết quả phân tích sẽ tạo ra các node con mới dựa trên "bonus" từ AI
4. Mỗi node con sẽ có nút "Xem chi tiết" để xem kết quả đầy đủ

#### Xem chi tiết phân tích
1. Sau khi phân tích, click nút **"Xem chi tiết"**
2. Modal sẽ hiển thị:
   - Mô tả tổng quan về phân tích
   - Các phân tích chi tiết từ "bonus" object
   - Giao diện đẹp với cards và icons

### 3. Luồng phân tích mẫu

1. **Bước 1**: Click "Phân tích" trên node gốc
   - AI sẽ phân tích dữ liệu tổng quan
   - Tạo ra các node con dựa trên kết quả

2. **Bước 2**: Click "Phân tích" trên node con
   - AI sẽ phân tích sâu hơn về từng nhóm người dùng
   - Tạo ra các node con tiếp theo

3. **Bước 3**: Xem chi tiết
   - Click "Xem chi tiết" để xem kết quả phân tích đầy đủ
   - Modal hiển thị mô tả và các phân tích chi tiết

## Dữ liệu được phân tích

Ứng dụng sử dụng dữ liệu mẫu bao gồm:

### Thống kê cơ bản
- Tổng người dùng: 1,250
- Người dùng hoạt động: 890
- Người dùng mới: 156

### Phân khúc người dùng
- Premium: 234 người
- Standard: 567 người  
- Basic: 449 người

### Hoạt động người dùng
- Daily Active: 456
- Weekly Active: 789
- Monthly Active: 890

### Hành vi người dùng
- Thời gian session trung bình: 12.5 phút
- Tính năng sử dụng nhiều nhất: Dashboard, Analytics, Reports
- Tỷ lệ chuyển đổi: 23.4%

### Phân tích chi tiết
- Page views: 15,420
- Bounce rate: 34.2%
- Thời gian trên site: 8.7 phút
- Tỷ lệ giữ chân: 67.8%

## API Integration

### Google Gemini AI
- API Key: `AIzaSyBHHB33PBHt8B4c8AkQCqQBCdTLUuKemWs`
- Model: `gemini-1.5-flash`
- Endpoint: Tự động gọi khi click "Phân tích"

### Cấu trúc response từ AI
```json
{
  "description": "Mô tả chi tiết về phân tích",
  "bonus": {
    "1": "Phân tích chi tiết 1",
    "2": "Phân tích chi tiết 2", 
    "3": "Phân tích chi tiết 3"
  }
}
```

## Troubleshooting

### Lỗi thường gặp

1. **Module not found**: Chạy `pnpm install` để cài đặt dependencies
2. **API Error**: Kiểm tra kết nối internet và API key Gemini
3. **Build Error**: Chạy `pnpm build` để kiểm tra lỗi

### Debug
- Mở Developer Tools (F12) để xem console logs
- Kiểm tra Network tab để xem API calls
- Xem terminal để debug server logs

## Tính năng nâng cao

### Tùy chỉnh dữ liệu
- Sửa file `app/page.tsx` để thay đổi dữ liệu mẫu
- Thêm dữ liệu thực từ database
- Tích hợp với API backend

### Tùy chỉnh AI prompts
- Sửa file `lib/gemini.ts` để thay đổi prompt
- Thêm context cụ thể cho từng loại phân tích
- Tùy chỉnh format response

### Styling
- Sửa file `app/globals.css` để thay đổi theme
- Tùy chỉnh components trong `components/`
- Thêm animations và transitions
