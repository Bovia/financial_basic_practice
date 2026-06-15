import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type QuestionType = "single" | "multiple" | "judge";

type ParsedQuestion = {
  id: number;
  type: QuestionType;
  score: number;
  title: string;
  options: [string, string, string, string];
  answer: string;
  analysis: string;
};

type ParsedPaper = {
  name: string;
  questions: ParsedQuestion[];
};

const SECTION_RE = /^(单选题|多选题|判断题)\(([\d.]+)分\)$/;
const QUESTION_NUM_RE = /^(\d+)\.$/;
const OPTION_RE = /^([A-D])\.$/;
const RESULT_RE = /正确答案：([A-D]+)/;
const FOOTER_RE = /^(答题卡|只看错题|0分|不及格|正确\d+|错误\d+|未答\d+)/;
const BOLD_ANSWER_RE = /^\*\*([A-D]+)\*\*$/;

const TYPE_MAP: Record<string, QuestionType> = {
  单选题: "single",
  多选题: "multiple",
  判断题: "judge",
};

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function detectFormat(content: string): "legacy" | "app" {
  return content.includes("**正确答案：**") ? "app" : "legacy";
}

function parseMd(content: string): ParsedPaper {
  return detectFormat(content) === "app" ? parseAppExportMd(content) : parseLegacyMd(content);
}

function parseAppExportMd(content: string): ParsedPaper {
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index++;
  }

  const paperName = lines[index]?.trim();
  if (!paperName) {
    throw new Error("未找到试卷标题");
  }
  index++;

  const questions: ParsedQuestion[] = [];

  function skipBlank() {
    while (index < lines.length && !lines[index].trim()) {
      index++;
    }
  }

  function currentLine() {
    return lines[index]?.trim() ?? "";
  }

  function isFooter(line: string) {
    return FOOTER_RE.test(line) || (/^\d+$/.test(line) && questions.length >= 100);
  }

  function readOption(label: string): string {
    skipBlank();
    const marker = currentLine();
    if (marker !== `${label}.`) {
      throw new Error(
        `第 ${questions.length + 1} 题缺少选项 ${label}.，当前行: ${marker || "(EOF)"}`
      );
    }
    index++;

    skipBlank();
    const text = currentLine();
    if (!text) {
      throw new Error(`第 ${questions.length + 1} 题选项 ${label} 内容为空`);
    }
    index++;
    return text;
  }

  function readAnswer(): string {
    while (index < lines.length) {
      skipBlank();
      if (index >= lines.length) break;

      const line = currentLine();
      if (SECTION_RE.test(line) || isFooter(line)) {
        throw new Error(`第 ${questions.length + 1} 题未找到正确答案`);
      }

      const boldMatch = line.match(BOLD_ANSWER_RE);
      if (boldMatch) {
        index++;
        return boldMatch[1];
      }

      const plain = stripBold(line);
      const inlineMatch = plain.match(/^正确答案：([A-D]+)$/);
      if (inlineMatch) {
        index++;
        return inlineMatch[1];
      }

      if (plain === "正确答案：" || plain === "作答结果：" || plain === "得分：" || /^\d+$/.test(plain)) {
        index++;
        continue;
      }

      index++;
    }

    throw new Error(`第 ${questions.length + 1} 题未找到正确答案`);
  }

  function skipScoreBlock() {
    while (index < lines.length) {
      skipBlank();
      const line = currentLine();
      if (!line) {
        index++;
        continue;
      }

      const plain = stripBold(line);
      if (plain === "得分：" || plain === "作答结果：" || /^\d+$/.test(plain)) {
        index++;
        continue;
      }

      return;
    }
  }

  function readAnalysis(): string {
    skipBlank();
    const header = currentLine();
    const plainHeader = stripBold(header);

    if (plainHeader !== "答案解析：" && !plainHeader.startsWith("答案解析：")) {
      throw new Error(`第 ${questions.length + 1} 题未找到答案解析，当前行: ${header || "(EOF)"}`);
    }

    index++;
    const inline = plainHeader.replace(/^答案解析：/, "").trim();
    if (inline) {
      return inline;
    }

    skipBlank();
    const parts: string[] = [];

    while (index < lines.length) {
      const line = currentLine();
      if (!line) {
        index++;
        if (parts.length > 0) break;
        continue;
      }
      if (SECTION_RE.test(line) || isFooter(line)) break;

      parts.push(line);
      index++;
    }

    const analysis = parts.join("").trim();
    if (!analysis) {
      throw new Error(`第 ${questions.length + 1} 题答案解析为空`);
    }
    return analysis;
  }

  function parseQuestion(sectionLine: string) {
    const sectionMatch = sectionLine.match(SECTION_RE);
    if (!sectionMatch) return;

    const currentType = TYPE_MAP[sectionMatch[1]];
    const currentScore = Number(sectionMatch[2]);
    index++;

    skipBlank();
    const titleParts: string[] = [];
    while (index < lines.length) {
      const titleLine = currentLine();
      if (!titleLine) {
        index++;
        continue;
      }
      if (OPTION_RE.test(titleLine) || SECTION_RE.test(titleLine) || isFooter(titleLine)) {
        break;
      }
      titleParts.push(titleLine);
      index++;
    }

    const title = titleParts.join("");
    if (!title) {
      throw new Error(`第 ${questions.length + 1} 题题干为空`);
    }

    const optionA = readOption("A");
    const optionB = readOption("B");
    let optionC = "";
    let optionD = "";

    if (currentType !== "judge") {
      optionC = readOption("C");
      optionD = readOption("D");
    }

    const answer = readAnswer();
    skipScoreBlock();
    const analysis = readAnalysis();

    questions.push({
      id: questions.length + 1,
      type: currentType,
      score: currentScore,
      title,
      options: [optionA, optionB, optionC, optionD],
      answer,
      analysis,
    });
  }

  while (index < lines.length) {
    skipBlank();
    if (index >= lines.length) break;

    const line = currentLine();
    if (!line) {
      index++;
      continue;
    }

    if (isFooter(line)) break;

    if (SECTION_RE.test(line)) {
      parseQuestion(line);
      continue;
    }

    index++;
  }

  return { name: paperName, questions };
}

function parseLegacyMd(content: string): ParsedPaper {
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index++;
  }

  const paperName = lines[index]?.trim();
  if (!paperName) {
    throw new Error("未找到试卷标题");
  }
  index++;

  let currentType: QuestionType = "single";
  let currentScore = 0.5;
  const questions: ParsedQuestion[] = [];

  function skipBlank() {
    while (index < lines.length && !lines[index].trim()) {
      index++;
    }
  }

  function readOption(label: string): string {
    skipBlank();
    const marker = lines[index]?.trim();
    if (marker !== `${label}.`) {
      throw new Error(
        `第 ${questions.length + 1} 题缺少选项 ${label}.，当前行: ${marker ?? "(EOF)"}`
      );
    }
    index++;

    skipBlank();
    const text = lines[index]?.trim();
    if (!text) {
      throw new Error(`第 ${questions.length + 1} 题选项 ${label} 内容为空`);
    }
    index++;
    return text;
  }

  while (index < lines.length) {
    skipBlank();
    if (index >= lines.length) break;

    const line = lines[index].trim();
    if (!line) {
      index++;
      continue;
    }

    if (FOOTER_RE.test(line)) break;

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      currentType = TYPE_MAP[sectionMatch[1]];
      currentScore = Number(sectionMatch[2]);
      index++;
      continue;
    }

    const questionMatch = line.match(QUESTION_NUM_RE);
    if (!questionMatch) {
      index++;
      continue;
    }

    const questionId = Number(questionMatch[1]);
    index++;

    const titleParts: string[] = [];
    while (index < lines.length) {
      skipBlank();
      if (index >= lines.length) break;

      const titleLine = lines[index].trim();
      if (OPTION_RE.test(titleLine) || SECTION_RE.test(titleLine) || QUESTION_NUM_RE.test(titleLine)) {
        break;
      }
      if (FOOTER_RE.test(titleLine)) break;
      titleParts.push(titleLine);
      index++;
    }

    const title = titleParts.join("");
    if (!title) {
      throw new Error(`第 ${questionId} 题题干为空`);
    }

    const optionA = readOption("A");
    const optionB = readOption("B");
    let optionC = "";
    let optionD = "";

    if (currentType !== "judge") {
      optionC = readOption("C");
      optionD = readOption("D");
    }

    skipBlank();
    const resultLine = lines[index]?.trim() ?? "";
    const resultMatch = resultLine.match(RESULT_RE);
    if (!resultMatch) {
      throw new Error(`第 ${questionId} 题未找到正确答案，当前行: ${resultLine}`);
    }
    index++;

    skipBlank();
    let analysis = "";
    const analysisHeader = lines[index]?.trim() ?? "";
    if (analysisHeader.startsWith("答案解析：")) {
      const inline = analysisHeader.replace(/^答案解析：/, "").trim();
      index++;
      if (inline) {
        analysis = inline;
      } else {
        skipBlank();
        analysis = lines[index]?.trim() ?? "";
        if (!analysis) {
          throw new Error(`第 ${questionId} 题答案解析为空`);
        }
        index++;
      }
    } else {
      throw new Error(`第 ${questionId} 题未找到答案解析，当前行: ${analysisHeader}`);
    }

    questions.push({
      id: questionId,
      type: currentType,
      score: currentScore,
      title,
      options: [optionA, optionB, optionC, optionD],
      answer: resultMatch[1],
      analysis,
    });
  }

  return { name: paperName, questions };
}

function main() {
  const inputPath = process.argv[2] ?? join(process.cwd(), "docs/temp.md");
  const outputPath = process.argv[3] ?? join(process.cwd(), "data/question-bank.json");
  const paperId = Number(process.argv[4] ?? "2");

  const content = readFileSync(inputPath, "utf-8");
  const parsed = parseMd(content);

  const bank = JSON.parse(readFileSync(outputPath, "utf-8")) as {
    categories: Array<{
      id: string;
      name: string;
      papers: Array<{ id: number; name: string; questions: ParsedQuestion[] }>;
    }>;
  };

  const category = bank.categories[0];
  if (!category) {
    throw new Error("题库分类为空");
  }

  const existingIndex = category.papers.findIndex((paper) => paper.id === paperId);
  const paper = {
    id: paperId,
    name: parsed.name,
    questions: parsed.questions,
  };

  if (existingIndex >= 0) {
    category.papers[existingIndex] = paper;
  } else {
    category.papers.push(paper);
  }

  category.papers.sort((a, b) => a.id - b.id);

  writeFileSync(outputPath, `${JSON.stringify(bank, null, 2)}\n`, "utf-8");

  const typeCount = parsed.questions.reduce(
    (acc, question) => {
      acc[question.type] += 1;
      return acc;
    },
    { single: 0, multiple: 0, judge: 0 }
  );

  console.log(`格式: ${detectFormat(content)}`);
  console.log(`试卷: ${parsed.name}`);
  console.log(`写入: ${outputPath} (paperId=${paperId})`);
  console.log(`共 ${parsed.questions.length} 题`);
  console.log(`单选 ${typeCount.single} / 多选 ${typeCount.multiple} / 判断 ${typeCount.judge}`);
}

main();
