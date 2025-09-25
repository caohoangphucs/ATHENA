import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBHHB33PBHt8B4c8AkQCqQBCdTLUuKemWs');

export interface AnalysisResult {
  description: string;
  bonus: {
    [key: string]: string;
  };
}

export async function analyzeUserBehavior(data: any, analysisType: string): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Phân tích hành vi người dùng ATHENA hệ sinh thái Sovico với loại phân tích: ${analysisType}
    
    Dữ liệu đầu vào:
    ${JSON.stringify(data, null, 2)}
    
    Hãy trả về kết quả phân tích dưới dạng JSON với cấu trúc:
    {
      "description": "Mô tả chi tiết về phân tích",
      "bonus": {
        "1": "Phân tích chi tiết 1",
        "2": "Phân tích chi tiết 2",
        "3": "Phân tích chi tiết 3"
      }
    }
    
    Đảm bảo trả về đúng định dạng JSON và nội dung phù hợp với loại phân tích được yêu cầu.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback nếu không parse được JSON
    return {
      description: text,
      bonus: {
        "1": "Phân tích chi tiết 1",
        "2": "Phân tích chi tiết 2", 
        "3": "Phân tích chi tiết 3"
      }
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      description: "Lỗi khi phân tích dữ liệu",
      bonus: {
        "1": "Không thể phân tích",
        "2": "Vui lòng thử lại",
        "3": "Liên hệ hỗ trợ"
      }
    };
  }
}
