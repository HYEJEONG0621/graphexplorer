export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };

  // 브라우저의 사전 요청 처리
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "POST 요청만 사용할 수 있습니다.",
      }),
    };
  }

  try {
    /*
     * Netlify 환경변수에서 API 키를 불러옵니다.
     * 앞뒤 공백이나 따옴표가 섞였을 경우 제거합니다.
     */
    const apiKey = String(process.env.OPENAI_API_KEY || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다.",
        }),
      };
    }

    // App.jsx에서 전달한 요청 내용을 읽습니다.
    let requestBody = {};

    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "잘못된 JSON 요청입니다.",
        }),
      };
    }

    const {
      grade = "middle1",
      expression,
      equation,
      exactAnalysis = {},
    } = requestBody;

    // App.jsx는 expression을 보내지만 equation도 호환되도록 처리
    const functionExpression = String(expression || equation || "").trim();

    if (!functionExpression) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "분석할 함수식이 전달되지 않았습니다.",
        }),
      };
    }

    const gradeLabel =
      {
        middle1: "중학교 1학년",
        middle2: "중학교 2학년",
        middle3: "중학교 3학년",
      }[grade] || "중학생";

    const featureText = Array.isArray(exactAnalysis.features)
      ? exactAnalysis.features
          .map((item) => {
            if (!Array.isArray(item)) return "";
            const [label, value] = item;
            return `- ${label}: ${value}`;
          })
          .filter(Boolean)
          .join("\n")
      : "";

    const systemPrompt = `
당신은 중학생의 함수 학습을 돕는 친절하고 정확한 수학 코치 '그래피'입니다.

학생에게 정답만 알려주지 말고, 함수식과 그래프의 관계를 관찰하도록 안내하세요.

반드시 지켜야 할 조건:
1. 답변은 한국어로 작성합니다.
2. 학생의 학년 수준에 맞는 쉬운 표현을 사용합니다.
3. 프로그램이 제공한 정확한 계산 결과와 모순되는 설명을 하지 않습니다.
4. 설명은 짧고 명확하게 작성합니다.
5. 반드시 유효한 JSON 객체만 출력합니다.
6. 마크다운 코드 블록과 추가 설명은 출력하지 않습니다.
`.trim();

    const userPrompt = `
학생 학년:
${gradeLabel}

학생이 입력한 함수식:
${functionExpression}

프로그램이 계산한 정확한 분석:
- 요약: ${exactAnalysis.summary || "제공되지 않음"}
${featureText || "- 세부 특징: 제공되지 않음"}

프로그램이 제시한 확인 문제:
${exactAnalysis.question || "제공되지 않음"}

프로그램이 계산한 정답:
${exactAnalysis.answer || "제공되지 않음"}

위 내용을 바탕으로 아래 JSON 형식으로만 답하세요.

{
  "title": "짧고 흥미로운 코칭 제목",
  "explanation": "함수식과 그래프의 관계를 학생 수준에 맞게 3~5문장으로 설명",
  "keyPoints": [
    "그래프에서 직접 확인할 점 1",
    "그래프에서 직접 확인할 점 2",
    "그래프에서 직접 확인할 점 3"
  ],
  "commonMistake": "이 함수에서 학생이 자주 하는 실수와 올바른 생각",
  "thinkingQuestion": "학생이 그래프를 관찰하며 생각할 질문 1개",
  "hint": "생각 질문을 해결하는 데 도움이 되는 짧은 힌트",
  "nextActivity": "이 함수와 연결하여 해 볼 다음 탐구 활동 1개"
}
`.trim();

    /*
     * 학습SOS랩에서 동작하는 방식과 동일하게
     * Chat Completions API를 사용합니다.
     */
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // OpenAI가 오류를 반환했을 때 200으로 위장하지 않고 그대로 전달
    if (!response.ok) {
      console.error("OpenAI API 오류:", {
        status: response.status,
        error: data?.error,
      });

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error:
            data?.error?.message ||
            `OpenAI API 요청에 실패했습니다. 상태 코드: ${response.status}`,
        }),
      };
    }

    const outputText =
      data?.choices?.[0]?.message?.content?.trim() || "";

    if (!outputText) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "AI 응답 내용이 비어 있습니다.",
        }),
      };
    }

    let feedback;

    try {
      const cleanedText = outputText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      feedback = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("AI JSON 파싱 오류:", parseError);
      console.error("AI 원본 응답:", outputText);

      // JSON 변환 실패 시에도 화면에 기본 피드백 표시
      feedback = {
        title: "그래피의 함수 코칭",
        explanation: outputText,
        keyPoints: [
          "함수식의 계수를 확인해 보세요.",
          "그래프가 어느 방향으로 움직이는지 관찰해 보세요.",
          "절편이나 꼭짓점의 위치를 확인해 보세요.",
        ],
        commonMistake:
          "함수식의 부호와 그래프가 움직이는 방향을 반대로 생각하지 않도록 주의하세요.",
        thinkingQuestion:
          exactAnalysis.question ||
          "함수식의 계수 하나를 바꾸면 그래프는 어떻게 달라질까요?",
        hint:
          "기울기, 절편, 꼭짓점 또는 그래프가 나타나는 사분면을 차례대로 확인하세요.",
        nextActivity:
          "계수의 값을 하나씩 바꾸어 기존 그래프와 새로운 그래프를 비교해 보세요.",
      };
    }

    // 응답 값이 빠졌을 때 기본값 보완
    const normalizedFeedback = {
      title: feedback?.title || "그래피의 함수 코칭",
      explanation:
        feedback?.explanation ||
        "함수식과 그래프의 특징을 연결하여 살펴보세요.",
      keyPoints: Array.isArray(feedback?.keyPoints)
        ? feedback.keyPoints
        : [],
      commonMistake:
        feedback?.commonMistake ||
        "함수식의 부호와 그래프의 방향을 함께 확인하세요.",
      thinkingQuestion:
        feedback?.thinkingQuestion ||
        "그래프에서 가장 먼저 확인할 수 있는 특징은 무엇인가요?",
      hint:
        feedback?.hint ||
        "기울기, 절편 또는 꼭짓점을 확인해 보세요.",
      nextActivity:
        feedback?.nextActivity ||
        "계수 값을 바꾸어 그래프의 변화를 비교해 보세요.",
    };

    /*
     * App.jsx에서 data.feedback을 사용하므로
     * 반드시 feedback이라는 이름으로 반환합니다.
     */
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        feedback: normalizedFeedback,
      }),
    };
  } catch (error) {
    console.error("ai-graph-coach 함수 오류:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error?.message ||
          "AI 그래프 코치 실행 중 서버 오류가 발생했습니다.",
      }),
    };
  }
}