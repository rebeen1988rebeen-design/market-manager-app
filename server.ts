import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini AI Client
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize Gemini AI SDK:", e);
    }
  }

  // Health Check Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", aiEnabled: !!process.env.GEMINI_API_KEY });
  });

  // AI Market Advisor Endpoint
  app.post("/api/ai/advisor", async (req, res) => {
    const { prompt, storeSummary, language = "ku", customApiKey } = req.body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Helper for Rule-Based Intelligent Store Analysis Fallback
    const generateSmartAnalysisFallback = () => {
      const {
        totalProductsCount = 0,
        lowStockItems = [],
        totalSalesInvoices = 0,
        totalRevenueIqd = 0,
        totalOutstandingCustomerDebtsIqd = 0,
      } = storeSummary || {};

      const lowCount = lowStockItems.length;
      const formattedRevenue = totalRevenueIqd.toLocaleString("en-US");
      const formattedDebts = totalOutstandingCustomerDebtsIqd.toLocaleString("en-US");

      if (language === "ku") {
        let text = `✨ **شیکاری ژیرانەی گشتی بۆ مارکێت و کۆگا**\n\n`;

        // Inventory Stock Section
        text += `📦 **دۆخی کۆگا و کاڵاکان:**\n`;
        text += `- کۆی گشتی جۆری کاڵاکان: **${totalProductsCount}** کاڵا\n`;
        if (lowCount > 0) {
          text += `- ⚠️ **ئاگاداری:** **${lowCount}** کاڵا نزیکن لە تەواوبوون. پێویستە دەستبەجێ داواکاری بۆ ئەم کاڵایانە بنێریت:\n`;
          lowStockItems.slice(0, 6).forEach((item: any) => {
            text += `  • **${item.nameKu || item.nameEn || "کاڵا"}** (بڕی ماوە: ${item.stock} - ئاستی ئاگادارکردنەوە: ${item.lowLimit})\n`;
          });
          if (lowCount > 6) {
            text += `  • و ${lowCount - 6} کاڵای تر...\n`;
          }
        } else {
          text += `- ✅ دۆخی بڕی کاڵاکان زۆر باشە و هیچ کاڵایەک لە ئاستی مەترسیداردا نییە.\n`;
        }

        // Sales & Revenue Section
        text += `\n💰 **دۆخی فرۆشتن و داهات:**\n`;
        text += `- ژمارەی وەصڵەکان: **${totalSalesInvoices}** فاکتۆری فرۆشتن\n`;
        text += `- کۆی گشتی داهات: **${formattedRevenue} د.ع**\n`;

        // Debts Section
        text += `\nڵ **قەرز و کریارەکان:**\n`;
        text += `- کۆی گشتی قەرزی لای کریاران: **${formattedDebts} د.ع**\n`;

        if (totalOutstandingCustomerDebtsIqd > totalRevenueIqd * 0.3 && totalRevenueIqd > 0) {
          text += `- ⚠️ **ئامۆژگاری دارایی:** ڕێژەی قەرزەکان بەرزە لە بەراورد بە داهات. پێشنیار دەکەین بەدواداچوون بۆ قەرزە کۆنەکان بکەیت بەرپێش کۆکردنەوەیان.\n`;
        } else {
          text += `- 👍 ڕێژەی قەرزەکان لە ئاستێکی ئاسایی و تەندروستدایە.\n`;
        }

        // Custom Prompt Response Section
        if (prompt && prompt.trim()) {
          text += `\n💡 **وەڵامی داواکارییەکەت ("${prompt}"):**\n`;
          text += `بەپێی زانیارییەکانی ئێستای سوپەرمارکەتەکەت، باشترین هەنگاو بریتییە لە پێداچوونەوە بە کاڵا پڕفڕۆشەکان، کەمکردنەوەی قەرزی کریاران، و زوو داواکردنی ئەو کاڵایانەی کەمبوونەتەوە تاوەکو فرۆشتنەکانت نەوەستن.`;
        } else {
          text += `\n🚀 **ڕاسپاردە سەرەکییەکان بۆ زیاترکردنی قازانج:**\n`;
          text += `1. **دابینکردنەوەی خێرا:** ئەولەویەت بدە بە داواکردنەوەی ئەو کاڵایانەی لە سەرەوە نیشان دراون.\n`;
          text += `2. **کۆنتڕۆڵی قەرز:** خشتەیەکی هەفتانە بۆ پەیوەندیکردن بەو کریارانە دابنێ کە قەرزیان لایە.\n`;
          text += `3. **داشکاندن و عەرز:** ئەو کاڵایانەی خاو دەفرۆشرێن بە داشکاندن یان بەستنەوەیان بە کاڵا بەهێزەکانەوە زووتر بفرۆشە.`;
        }

        return text;
      } else {
        let text = `✨ **Smart Store & Inventory Analysis Report**\n\n`;
        text += `📦 **Inventory Status:**\n`;
        text += `- Total Product Types: **${totalProductsCount}**\n`;
        if (lowCount > 0) {
          text += `- ⚠️ **Attention:** **${lowCount}** items are running low on stock. Consider reordering soon.\n`;
        } else {
          text += `- ✅ Inventory levels are healthy.\n`;
        }
        text += `\n💰 **Sales & Revenue:**\n`;
        text += `- Total Sales Invoices: **${totalSalesInvoices}**\n`;
        text += `- Total Revenue: **${formattedRevenue} IQD**\n`;
        text += `- Total Customer Debts: **${formattedDebts} IQD**\n`;
        return text;
      }
    };

    // If key is totally missing/empty, return smart analysis directly
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.json({
        advice: generateSmartAnalysisFallback(),
      });
    }

    try {
      if (!ai || (ai as any).apiKey !== apiKey) {
        ai = new GoogleGenAI({
          apiKey: apiKey,
        });
        (ai as any).apiKey = apiKey;
      }

      const systemInstruction = language === "ku"
        ? `تۆ یاریدەدەری ژیری مارکێت و سوپەرمارکێتی. وەڵامەکانت بە زمانی کوردی سۆرانی شێوازێکی زۆر ئەدەبی، بەسوود و پیشەیی بێت.
زانیاری کۆگا و فرۆشتنی مارکێتەکەت پێدەدرێت. ئامۆژگاری بۆ زیادکردنی قازانج، بەڕێوەبردنی کاڵا کەمبووەکان، و ستراتیژی داواکردن پێشکەش بکە.
کورت و ڕوون بێت، بە ڕێکخراوی نیشانی بدە.`
        : `You are an expert AI retail and store manager advisor. Provide actionable, concise business insights, stock reorder suggestions, and profit optimization advice based on the provided store data. Response should be clear and professional.`;

      const userMessage = `
[داتای ئێستای مارکێت / Store Context]:
${JSON.stringify(storeSummary, null, 2)}

[پرسیار یان داواکاری / User Query]:
${prompt || "تکایە شیکاری گشتی بۆ کۆگا و فرۆشتنەکانم بکە و ڕاسپاردەم پێ بدە."}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        advice: response.text || generateSmartAnalysisFallback(),
      });
    } catch {
      // Fallback gracefully to smart analysis if Gemini fails or token is unavailable
      res.json({
        advice: generateSmartAnalysisFallback(),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
