# ATHENA AI Analysis

Ứng dụng phân tích hành vi người dùng ATHENA hệ sinh thái Sovico sử dụng trí tuệ nhân tạo.

## Tính năng

- 🌳 **Cây phân tích tương tác**: Hiển thị cấu trúc phân tích dạng cây với khả năng mở rộng/thu gọn
- 🤖 **AI Analysis**: Tích hợp Google Gemini AI để phân tích dữ liệu hành vi người dùng
- 📊 **Modal chi tiết**: Hiển thị kết quả phân tích chi tiết trong modal
- 🎯 **Phân tích động**: Tạo node con mới dựa trên kết quả phân tích AI
- 📱 **Responsive Design**: Giao diện thân thiện trên mọi thiết bị

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
# hoặc
pnpm install
```

2. Chạy ứng dụng:
```bash
npm run dev
# hoặc
pnpm dev
```

3. Mở trình duyệt và truy cập: `http://localhost:3000`

## Cấu trúc dự án

```
AI/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── AnalysisModal.tsx
│   └── NodeTree.tsx
├── lib/
│   ├── gemini.ts
│   └── utils.ts
└── package.json
```

## Cách sử dụng

1. **Xem cây phân tích**: Trang chính hiển thị cây phân tích với node gốc "Phân tích thành phần người dùng"

2. **Mở rộng node**: Click vào mũi tên bên cạnh node để mở rộng/thu gọn các node con

3. **Phân tích dữ liệu**: 
   - Click nút "Phân tích" trên bất kỳ node nào
   - AI sẽ phân tích dữ liệu và tạo node con mới dựa trên kết quả

4. **Xem chi tiết**: Click "Xem chi tiết" để mở modal hiển thị kết quả phân tích đầy đủ

## API Integration

Ứng dụng sử dụng Google Gemini AI API với key: `AIzaSyBHHB33PBHt8B4c8AkQCqQBCdTLUuKemWs`

API sẽ phân tích dữ liệu và trả về JSON với cấu trúc:
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

## Dữ liệu mẫu

Ứng dụng sử dụng dữ liệu mẫu về hành vi người dùng bao gồm:
- Tổng số người dùng: 1,250
- Người dùng hoạt động: 890
- Người dùng mới: 156
- Phân khúc người dùng (Premium, Standard, Basic)
- Hoạt động người dùng (Daily, Weekly, Monthly)
- Hành vi người dùng (Thời gian session, tính năng sử dụng, tỷ lệ chuyển đổi)

## Công nghệ sử dụng

- **Next.js 14**: Framework React với App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Google Gemini AI**: AI Analysis
- **Lucide React**: Icons
- **Radix UI**: UI Components
