
import { GoogleGenAI } from "@google/genai";

// Always initialize GoogleGenAI with the API key from process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMCCommentary = async (
  lastResult: { result: number; type: string },
  userWin: boolean,
  balance: number
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Bạn là một MC sòng bài cực kỳ quyến rũ, sắc sảo và hài hước tại sòng bài "Tài Xỉu Thượng Lưu".
        Kết quả vừa rồi là: ${lastResult.result} (${lastResult.type}).
        Người chơi vừa ${userWin ? 'THẮNG' : 'THUA'}.
        Số dư hiện tại của họ là: ${balance} Gold.
        Hãy viết một câu bình luận ngắn gọn (dưới 20 từ) để khích lệ hoặc trêu chọc người chơi một cách duyên dáng.
        Sử dụng ngôn ngữ hiện đại, sang chảnh.
      `,
    });
    // The response.text property is a getter that returns the extracted string output.
    return response.text || "Đặt cược tiếp thôi nào các đại gia!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Chúc bạn may mắn ván sau nhé!";
  }
};
