// 知识库相关类型
export interface SearchResult {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'file' | 'google_sheet';
  status: 'active' | 'processing' | 'error';
  chunks?: number;
  embeddings?: number;
}

const STORAGE_KEY = 'launchbox_knowledge_sources_v2';

// 获取知识源列表
export function getKnowledgeSources(): KnowledgeSource[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// RAG语义检索函数
export async function searchKnowledgeBase(query: string, limit: number = 5): Promise<SearchResult[]> {
  const sources = getKnowledgeSources().filter(source => source.status === 'active');
  
  if (sources.length === 0) {
    return [];
  }

  // 模拟向量检索过程
  await new Promise(resolve => setTimeout(resolve, 800));

  // 预定义的知识库内容（模拟真实的向量检索结果）
  const knowledgeBase = [
    {
      sourceId: '1',
      sourceName: '游戏运营手册',
      chunks: [
        {
          content: '用户留存率是衡量游戏成功的关键指标之一。通常，新用户的7日留存率应该保持在30%以上，30日留存率应该在15%以上。可以通过优化新手引导、增加社交功能、定期更新内容来提升留存率。提升留存的具体方法包括：1) 完善新手教程，确保玩家快速上手；2) 设计每日任务和签到奖励；3) 增加公会系统和好友互动；4) 定期推出新内容和活动。',
          keywords: ['留存率', '用户留存', '新手引导', '社交功能', '日活', '月活'],
          metadata: { page: 23, section: '用户留存策略' }
        },
        {
          content: '游戏内购系统的设计需要平衡玩家体验和商业化收益。建议采用多层次付费模型：1) 低价值道具（0.99-4.99美元）用于日常消费；2) 中等价值礼包（9.99-19.99美元）用于节假日促销；3) 高价值限定商品（49.99-99.99美元）用于重度付费用户。同时要避免强制付费，保持游戏的公平性。',
          keywords: ['内购', '付费模型', '商业化', '道具', '礼包', '定价策略'],
          metadata: { page: 67, section: '商业化策略' }
        },
        {
          content: '活动策划应该与游戏的核心玩法紧密结合，避免为了活动而活动。建议每月举办1-2次大型活动，每周举办1-2次小型活动，保持玩家的新鲜感。活动类型可以包括：限时挑战、收集活动、竞技比赛、节日庆典等。重要的是要跟踪活动数据，包括参与率、完成率、收益贡献等指标。',
          keywords: ['活动策划', '活动运营', '限时挑战', '收集活动', '竞技比赛', '数据分析'],
          metadata: { page: 45, section: '活动运营' }
        },
        {
          content: '游戏数据分析的核心指标包括：DAU（日活跃用户）、MAU（月活跃用户）、ARPU（每用户平均收益）、LTV（用户生命周期价值）、CAC（用户获取成本）等。需要建立完整的数据监控体系，实时跟踪这些关键指标的变化趋势，及时发现问题并调整运营策略。',
          keywords: ['数据分析', 'DAU', 'MAU', 'ARPU', 'LTV', 'CAC', '运营指标'],
          metadata: { page: 89, section: '数据分析' }
        }
      ]
    },
    {
      sourceId: '2',
      sourceName: '玩家反馈数据表',
      chunks: [
        {
          content: '根据最新的玩家反馈数据，65%的玩家认为游戏难度适中，23%认为过于简单，12%认为过于困难。建议在后续版本中增加难度选择功能，让玩家可以根据自己的技能水平选择合适的挑战难度。同时，可以考虑添加自适应难度系统。',
          keywords: ['游戏难度', '玩家反馈', '难度选择', '自适应难度', '用户体验'],
          metadata: { row: 156, feedback_type: '游戏体验' }
        },
        {
          content: '玩家对游戏画面和音效的满意度较高，分别达到了4.2/5和4.0/5的评分。但对游戏剧情的评价相对较低，只有3.6/5。建议加强剧情设计，增加更多有趣的角色和故事情节，提升游戏的沉浸感。',
          keywords: ['画面', '音效', '剧情', '角色设计', '故事情节', '沉浸感'],
          metadata: { row: 203, feedback_type: '内容评价' }
        },
        {
          content: '社交功能使用率数据显示：好友系统使用率78%，公会系统使用率45%，聊天功能使用率62%。玩家希望增加更多社交互动方式，如组队副本、好友PK、社区活动等。这些功能对提升用户粘性和留存率有重要作用。',
          keywords: ['社交功能', '好友系统', '公会系统', '聊天功能', '组队副本', '用户粘性'],
          metadata: { row: 89, feedback_type: '社交体验' }
        }
      ]
    },
    {
      sourceId: '3',
      sourceName: '竞品分析报告',
      chunks: [
        {
          content: '主要竞品的成功经验包括：1) 精美的画面表现和流畅的操作体验；2) 丰富的内容更新和活动策划；3) 完善的社交系统和公会玩法；4) 合理的付费设计和价值感营造。我们可以借鉴这些优点，结合自身特色，打造差异化的竞争优势。',
          keywords: ['竞品分析', '成功经验', '画面表现', '内容更新', '社交系统', '付费设计'],
          metadata: { section: '竞品优势分析' }
        },
        {
          content: '市场趋势分析显示，休闲游戏和中重度游戏都有增长空间。玩家越来越重视游戏的社交属性和长期价值。建议我们在保持核心玩法的基础上，增强社交元素，同时优化新手体验，降低玩家进入门槛。',
          keywords: ['市场趋势', '休闲游戏', '中重度游戏', '社交属性', '长期价值', '新手体验'],
          metadata: { section: '市场趋势' }
        }
      ]
    },
    {
      sourceId: '4',
      sourceName: '游戏奖励结构设计指南',
      chunks: [
        {
          content: '英雄奖励设计：无等级区分的英雄奖励稀有度为基础级别，适合作为常规活动奖励。英雄奖励主要用于丰富玩家的角色选择，提升游戏策略性和可玩性。建议在新手引导、签到活动、成就系统中适量投放。',
          keywords: ['英雄', '角色', '无等级区分', '常规奖励', '新手引导', '签到', '成就系统'],
          metadata: { category: '英雄奖励', rarity: '基础' }
        },
        {
          content: '皮肤奖励体系：皮肤按等级划分为T1-T6，其中T1为最高稀有度（限定商业化皮肤），T6为最低稀有度（直售商业化皮肤+活跃皮肤）。T1-T2.5为限定商业化皮肤，T3为限定商业化皮肤+直售商业化皮肤，T3.5-T4为限定商业化皮肤+直售商业化皮肤+活跃皮肤，T5-T6为直售商业化皮肤+活跃皮肤。皮肤是玩家展示个性和身份的重要载体。',
          keywords: ['皮肤', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', '限定', '直售', '活跃皮肤', '商业化'],
          metadata: { category: '皮肤奖励', rarity: '分级制' }
        },
        {
          content: '局内周边资源奖励：包括动态头像框（最高稀有度）、称号标签、静态头像框、头像、表情、回城特效、击杀特效、加速特效等。这些奖励主要用于提升玩家的游戏体验和社交展示。动态头像框稀有度最高，建议用于重要活动的终极奖励。',
          keywords: ['动态头像框', '称号标签', '静态头像框', '头像', '表情', '回城特效', '击杀特效', '加速特效', '社交展示'],
          metadata: { category: '局内周边资源', rarity: '动态头像框最高' }
        },
        {
          content: '特殊奖励类型：个性载载（亲密度道具，稀有度最低），舞蹈动作、播报、个性化按键（需与皮肤/英雄绑定，较不通用）。这些奖励具有特殊的功能性或限制性，适合作为特定活动或成就的独特奖励。',
          keywords: ['个性载载', '亲密度道具', '舞蹈动作', '播报', '个性化按键', '皮肤绑定', '英雄绑定', '特殊功能'],
          metadata: { category: '特殊奖励', rarity: '个性载载最低' }
        },
        {
          content: '奖励结构建议：在设计活动奖励时，应该根据活动的重要性和参与难度来分配不同稀有度的奖励。高稀有度奖励（如T1-T2皮肤、动态头像框）应该用于重要节日活动、竞技赛事的顶级奖励。中等稀有度奖励（如T3-T4皮肤、静态头像框）适合常规活动的主要奖励。低稀有度奖励（如表情、个性载载）可以作为参与奖励或阶段性奖励。',
          keywords: ['奖励分配', '活动重要性', '参与难度', '稀有度匹配', '节日活动', '竞技赛事', '常规活动', '参与奖励'],
          metadata: { category: '奖励策略', rarity: '综合建议' }
        }
      ]
    }
  ];

  // 简单的关键词匹配算法（模拟向量相似度计算）
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  knowledgeBase.forEach(source => {
    // 检查该数据源是否在当前激活的知识源中
    const isSourceActive = sources.some(s => s.id === source.sourceId);
    if (!isSourceActive) return;

    source.chunks.forEach((chunk, index) => {
      let score = 0;
      
      // 检查内容匹配
      if (chunk.content.toLowerCase().includes(queryLower)) {
        score += 0.8;
      }

      // 检查关键词匹配
      const matchingKeywords = chunk.keywords.filter(keyword => 
        keyword.toLowerCase().includes(queryLower) || 
        queryLower.includes(keyword.toLowerCase())
      );
      score += matchingKeywords.length * 0.3;

      // 语义相关性加分（模拟向量相似度）
      const semanticKeywords = {
        '留存': ['用户', '活跃', '粘性', '回访'],
        '收益': ['收入', '付费', '商业化', '变现'],
        '活动': ['运营', '策划', '推广', '营销'],
        '数据': ['分析', '指标', '监控', '统计'],
        '社交': ['好友', '公会', '互动', '聊天'],
        '难度': ['挑战', '平衡', '体验', '设计']
      };

      Object.entries(semanticKeywords).forEach(([key, relatedWords]) => {
        if (queryLower.includes(key)) {
          relatedWords.forEach(word => {
            if (chunk.content.toLowerCase().includes(word)) {
              score += 0.2;
            }
          });
        }
      });

      if (score > 0) {
        results.push({
          id: `${source.sourceId}-${index}`,
          sourceId: source.sourceId,
          sourceName: source.sourceName,
          content: chunk.content,
          score: Math.min(score, 1.0), // 限制最高分数为1.0
          metadata: chunk.metadata
        });
      }
    });
  });

  // 按相似度分数排序并返回前N个结果
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// 格式化检索结果为上下文
export function formatSearchResultsAsContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const context = results.map((result, index) => {
    return `[知识库${index + 1}] ${result.sourceName}：\n${result.content}`;
  }).join('\n\n');

  return `基于知识库的相关信息：\n\n${context}\n\n请基于以上信息回答用户问题：`;
}
