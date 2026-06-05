import { writeFileSync } from "fs";
import { join } from "path";

type Question = {
  id: number;
  title: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  analysis: string;
};

const BASE_QUESTIONS: Omit<Question, "id">[] = [
  {
    title: "以下哪项是货币的基本职能？",
    options: ["价值尺度", "信用创造", "风险管理", "财务分析"],
    answer: "A",
    analysis: "货币的基本职能包括价值尺度、流通手段、贮藏手段、支付手段和世界货币。价值尺度是货币最基本的功能。",
  },
  {
    title: "以下哪种利率是由中央银行设定的？",
    options: ["市场利率", "基准利率", "贷款利率", "存款利率"],
    answer: "B",
    analysis: "基准利率由中央银行设定，是金融市场利率的参考标准，其他利率通常在此基础上浮动。",
  },
  {
    title: "通货膨胀是指什么现象？",
    options: ["物价普遍持续上涨", "物价普遍持续下降", "货币供应量减少", "经济增长放缓"],
    answer: "A",
    analysis: "通货膨胀是指一般物价水平在一段时间内持续上涨的经济现象，通常伴随货币购买力下降。",
  },
  {
    title: "以下哪项属于间接融资？",
    options: ["发行股票", "银行贷款", "发行债券", "私募股权融资"],
    answer: "B",
    analysis: "间接融资指资金需求者通过金融中介机构（如银行）获得资金，银行贷款是最典型的间接融资方式。",
  },
  {
    title: "GDP 的全称是什么？",
    options: ["国民生产总值", "国内生产总值", "国民收入", "个人可支配收入"],
    answer: "B",
    analysis: "GDP（Gross Domestic Product）即国内生产总值，指一定时期内一国境内生产的全部最终产品和服务的市场价值。",
  },
  {
    title: "以下哪项是商业银行的主要职能？",
    options: ["发行货币", "信用中介", "制定货币政策", "监管金融机构"],
    answer: "B",
    analysis: "商业银行的主要职能是信用中介，通过吸收存款和发放贷款实现资金融通。",
  },
  {
    title: "复利与单利的区别是什么？",
    options: ["复利不计利息", "复利利息计入本金再计息", "单利利率更高", "两者完全相同"],
    answer: "B",
    analysis: "复利是将每期利息加入本金，在下一期一同计算利息；单利仅对原始本金计息。",
  },
  {
    title: "以下哪项属于货币政策工具？",
    options: ["调整税率", "公开市场操作", "增加政府支出", "发行国债"],
    answer: "B",
    analysis: "公开市场操作是中央银行常用的货币政策工具，通过买卖政府债券调节市场流动性。",
  },
  {
    title: "股票代表的是？",
    options: ["债权", "所有权", "租赁权", "使用权"],
    answer: "B",
    analysis: "股票代表持有者对股份公司的所有权，股东享有分红权和表决权等权益。",
  },
  {
    title: "以下哪项风险属于系统性风险？",
    options: ["个股业绩下滑", "宏观经济衰退", "企业管理不善", "产品召回事件"],
    answer: "B",
    analysis: "系统性风险影响整个市场，如经济衰退、利率变动等，无法通过分散投资完全消除。",
  },
  {
    title: "债券的票面利率是指？",
    options: ["市场收益率", "发行人承诺的固定利率", "通货膨胀率", "违约概率"],
    answer: "B",
    analysis: "票面利率是债券发行人承诺按期支付给债券持有人的固定利率，通常以年化形式表示。",
  },
  {
    title: "以下哪项是外汇市场的主要功能？",
    options: ["商品定价", "货币兑换与汇率形成", "股票交易", "期货交易"],
    answer: "B",
    analysis: "外汇市场主要功能是不同货币之间的兑换，并形成各国货币之间的汇率。",
  },
  {
    title: "流动性风险是指？",
    options: ["无法及时变现资产", "利率上升风险", "信用违约风险", "汇率波动风险"],
    answer: "A",
    analysis: "流动性风险指资产无法在不产生重大价格损失的情况下迅速转化为现金的风险。",
  },
  {
    title: "以下哪项属于财政政策？",
    options: ["降低存款准备金率", "调整政府税收和支出", "调整基准利率", "公开市场操作"],
    answer: "B",
    analysis: "财政政策是政府通过调整税收和公共支出来影响经济的政策，属于财政部门的职能。",
  },
  {
    title: "市盈率（P/E）用于衡量？",
    options: ["公司负债水平", "股价相对盈利的估值", "资产回报率", "现金流状况"],
    answer: "B",
    analysis: "市盈率 = 股价 / 每股收益，反映投资者愿意为每元盈利支付的价格，是常用的估值指标。",
  },
  {
    title: "以下哪项是金融衍生品？",
    options: ["定期存款", "期货合约", "国债", "商业票据"],
    answer: "B",
    analysis: "金融衍生品价值来源于标的资产，包括期货、期权、掉期等，期货合约是典型衍生品。",
  },
  {
    title: "存款准备金率是？",
    options: ["银行贷款利率", "银行须存入央行的存款比例", "企业所得税率", "通货膨胀目标"],
    answer: "B",
    analysis: "存款准备金率是商业银行按规定向中央银行缴存的存款准备金占其存款总额的比例。",
  },
  {
    title: "以下哪项属于直接融资？",
    options: ["银行借款", "企业发行股票", "信托贷款", "融资租赁"],
    answer: "B",
    analysis: "直接融资是资金需求者直接在金融市场上向资金供给者融通资金，如发行股票、债券。",
  },
  {
    title: "名义利率与实际利率的关系是？",
    options: ["实际利率 = 名义利率 + 通胀率", "实际利率 = 名义利率 - 通胀率", "两者无关", "实际利率总是更高"],
    answer: "B",
    analysis: "根据费雪效应，实际利率约等于名义利率减去通货膨胀率，反映资金的真实回报。",
  },
  {
    title: "以下哪项是保险的基本功能？",
    options: ["投机获利", "风险转移与损失补偿", "货币发行", "价格发现"],
    answer: "B",
    analysis: "保险的基本功能是通过风险转移和损失补偿，帮助投保人应对不确定的损失事件。",
  },
];

const EXTRA_QUESTIONS: Omit<Question, "id">[] = [
  {
    title: "货币市场与资本市场的主要区别是？",
    options: ["交易工具期限不同", "交易地点不同", "参与者不同", "无区别"],
    answer: "A",
    analysis: "货币市场交易期限在一年以内的短期金融工具；资本市场交易期限在一年以上的长期工具。",
  },
  {
    title: "以下哪项不属于金融监管目标？",
    options: ["维护金融稳定", "保护投资者", "垄断金融市场", "防范系统性风险"],
    answer: "C",
    analysis: "金融监管的目标是维护稳定、保护投资者、防范风险，而非垄断市场。",
  },
  {
    title: "信用利差是指？",
    options: ["无风险利率", "高风险债券与无风险债券收益率之差", "存款利率", "汇率差价"],
    answer: "B",
    analysis: "信用利差反映市场对信用风险的定价，即高风险债券收益率超出无风险利率的部分。",
  },
  {
    title: "以下哪项是中央银行的核心职能？",
    options: ["吸收公众存款", "制定和执行货币政策", "发放商业贷款", "承销证券"],
    answer: "B",
    analysis: "中央银行负责制定和执行货币政策、维护金融稳定、管理支付系统等，不从事商业银行业务。",
  },
  {
    title: "投资组合分散化的主要目的是？",
    options: ["提高收益", "降低非系统性风险", "避税", "增加杠杆"],
    answer: "B",
    analysis: "分散投资可以降低非系统性风险（个股或行业特有风险），但无法消除系统性风险。",
  },
  {
    title: "以下哪项指标反映偿债能力？",
    options: ["流动比率", "市盈率", "市净率", "换手率"],
    answer: "A",
    analysis: "流动比率 = 流动资产 / 流动负债，衡量企业短期偿债能力。",
  },
  {
    title: "量化宽松政策通常指？",
    options: ["提高利率", "大规模购买资产增加流动性", "减少政府支出", "提高存款准备金率"],
    answer: "B",
    analysis: "量化宽松是央行在利率接近零时，通过大规模购买资产向市场注入流动性的非常规货币政策。",
  },
  {
    title: "以下哪项属于表外业务？",
    options: ["发放贷款", "银行承兑汇票", "吸收存款", "购买国债"],
    answer: "B",
    analysis: "表外业务不反映在资产负债表内，如银行承兑汇票、保函、信用证等或有负债业务。",
  },
  {
    title: "资本充足率用于衡量？",
    options: ["银行盈利能力", "银行资本对风险资产的覆盖程度", "存款增长率", "不良贷款率"],
    answer: "B",
    analysis: "资本充足率 = 资本净额 / 风险加权资产，是衡量银行抵御风险能力的重要监管指标。",
  },
  {
    title: "以下哪项是汇率标价法的直接标价法？",
    options: ["1美元=7.2人民币", "1人民币=0.14美元", "以本币表示外币", "以黄金表示货币"],
    answer: "C",
    analysis: "直接标价法是以一定单位的外国货币为标准，折算成若干单位本国货币来表示汇率。",
  },
];

const ALL_TEMPLATES = [...BASE_QUESTIONS, ...EXTRA_QUESTIONS];

function buildPaperQuestions(paperIndex: number): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < 20; i++) {
    const template = ALL_TEMPLATES[(i + paperIndex * 3) % ALL_TEMPLATES.length];
    questions.push({
      id: paperIndex * 100 + i + 1,
      ...template,
    });
  }
  return questions;
}

const bank = {
  categories: [
    {
      id: "financial-basics",
      name: "金融基础",
      papers: Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: `第${i + 1}套题`,
        questions: buildPaperQuestions(i),
      })),
    },
  ],
};

const outPath = join(process.cwd(), "data", "question-bank.json");
writeFileSync(outPath, JSON.stringify(bank, null, 2), "utf-8");
console.log(`Generated ${outPath}`);
