/**
 * 文本向量化服务 (Text Embedding Service)
 * 
 * 📋 功能说明：
 * 将文本转换为数字向量，用于计算文本相似度和语义搜索。
 * 使用 TensorFlow.js 和 Universal Sentence Encoder 模型。
 * 
 * 🎯 核心能力：
 * 1. 📝 文本向量化（文字 → 数字数组）
 * 2. 🔍 计算相似度（余弦相似度）
 * 3. 🔎 语义搜索（找到最相似的文本）
 * 
 * 💡 使用场景：
 * 
 * 场景1: 知识库搜索
 * ```
 * 用户问："如何提升留存率？"
 * → 向量化：[0.1, 0.3, 0.8, ...]
 * → 在知识库中搜索相似的向量
 * → 找到相关的历史案例
 * ```
 * 
 * 场景2: 文档相似度对比
 * ```
 * 文档A："这个游戏很好玩" → [0.1, 0.8, 0.3, ...]
 * 文档B："这款游戏不错"   → [0.2, 0.7, 0.4, ...]
 * → 计算相似度：0.95 → 非常相似
 * ```
 * 
 * 🔧 技术栈：
 * - TensorFlow.js：机器学习框架
 * - Universal Sentence Encoder：Google的句子编码模型
 * - WebGL/CPU后端：硬件加速
 * 
 * ⚠️ 注意：
 * - 首次使用需要下载模型（约50MB）
 * - 优先使用WebGL加速，不可用时降级到CPU
 * 
 * @module embeddingService
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as use from '@tensorflow-models/universal-sentence-encoder';

/**
 * Embedding服务类
 * 
 * 提供文本向量化和相似度计算功能。
 */
class EmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * 初始化模型
   * 
   * 加载Universal Sentence Encoder模型。
   * 首次调用会下载模型文件（约50MB），后续从缓存加载。
   * 
   * @example
   * ```typescript
   * await embeddingService.initialize();
   * console.log('模型已就绪');
   * ```
   */
  async initialize(): Promise<void> {
    if (this.model) return;
    
    if (this.isLoading) {
      return this.loadPromise!;
    }

    this.isLoading = true;
    this.loadPromise = this._loadModel();
    return this.loadPromise;
  }

  private async _loadModel(): Promise<void> {
    try {
      console.log('开始加载Universal Sentence Encoder模型...');
      
      // 确保TensorFlow.js后端已准备就绪
      await tf.ready();
      
      // 尝试设置最佳可用后端
      const availableBackends = tf.engine().registryFactory;
      console.log('可用后端:', Object.keys(availableBackends));
      
      // 优先使用WebGL，如果不可用则使用CPU
      try {
        await tf.setBackend('webgl');
        console.log('使用WebGL后端');
      } catch (webglError) {
        console.warn('WebGL后端不可用，切换到CPU后端:', webglError);
        await tf.setBackend('cpu');
        console.log('使用CPU后端');
      }
      
      console.log('当前后端:', tf.getBackend());
      
      this.model = await use.load();
      console.log('模型加载完成！');
      this.isLoading = false;
    } catch (error) {
      console.error('模型加载失败:', error);
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * 检查模型是否已加载
   * 
   * @returns true = 已加载, false = 未加载
   */
  isReady(): boolean {
    return this.model !== null;
  }

  /**
   * 批量文本向量化
   * 
   * 将多个文本转换为向量数组。
   * 
   * @param texts - 文本数组
   * @returns Promise<number[][]> - 向量数组（每个文本对应一个512维向量）
   * 
   * @example
   * ```typescript
   * const vectors = await embeddingService.embed([
   *   "这个游戏很好玩",
   *   "这款游戏不错"
   * ]);
   * // vectors[0] = [0.1, 0.3, ..., 0.8]  (512个数字)
   * // vectors[1] = [0.2, 0.4, ..., 0.7]  (512个数字)
   * ```
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (!this.model) {
      throw new Error('模型未初始化，请先调用 initialize()');
    }

    try {
      const embeddings = await this.model.embed(texts);
      return embeddings.arraySync() as number[][];
    } catch (error) {
      console.error('向量化失败:', error);
      throw error;
    }
  }

  /**
   * 单个文本向量化
   * 
   * 将单个文本转换为向量。
   * 
   * @param text - 文本
   * @returns Promise<number[]> - 向量（512维）
   * 
   * @example
   * ```typescript
   * const vector = await embeddingService.embedSingle("这个游戏很好玩");
   * // vector = [0.1, 0.3, ..., 0.8]  (512个数字)
   * ```
   */
  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embed([text]);
    return embeddings[0];
  }

  /**
   * 计算余弦相似度
   * 
   * 计算两个向量的相似度（0-1之间，1表示完全相同）。
   * 
   * @param vecA - 向量A
   * @param vecB - 向量B
   * @returns 相似度（0-1之间）
   * 
   * @example
   * ```typescript
   * const similarity = embeddingService.cosineSimilarity(
   *   [0.1, 0.8, 0.3],
   *   [0.2, 0.7, 0.4]
   * );
   * // similarity = 0.95 (非常相似)
   * ```
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // 批量相似度计算
  calculateSimilarities(queryEmbedding: number[], contentEmbeddings: number[][]): number[] {
    return contentEmbeddings.map(embedding => 
      this.cosineSimilarity(queryEmbedding, embedding)
    );
  }

  // 释放资源
  dispose(): void {
    if (this.model) {
      // Universal Sentence Encoder没有dispose方法，但可以清空引用
      this.model = null;
    }
  }
}

// 全局实例
export const embeddingService = new EmbeddingService();

// 知识库向量化结果接口
export interface EmbeddedChunk {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

// RAG搜索结果接口
export interface RAGSearchResult {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

// 内容分块和向量化
export async function vectorizeContent(
  sourceId: string, 
  sourceName: string, 
  content: string,
  chunkSize: number = 300
): Promise<EmbeddedChunk[]> {
  await embeddingService.initialize();

  // 分块
  const chunks = chunkContent(content, chunkSize);
  
  // 向量化所有块
  const embeddings = await embeddingService.embed(chunks);
  
  // 组合结果
  return chunks.map((chunk, index) => ({
    id: `${sourceId}-chunk-${index}`,
    sourceId,
    sourceName: `${sourceName} (第${index + 1}块)`,
    content: chunk,
    embedding: embeddings[index],
    metadata: {
      chunkIndex: index,
      totalChunks: chunks.length,
      chunkSize: chunk.length
    }
  }));
}

// 内容分块函数
function chunkContent(content: string, chunkSize: number = 300): string[] {
  const chunks: string[] = [];
  const sentences = content.split(/[。！？；\n]/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (sentence.trim().length === 0) continue;
    
    // 如果当前块加上新句子超过限制，先保存当前块
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence.trim();
    } else {
      currentChunk += (currentChunk.length > 0 ? '。' : '') + sentence.trim();
    }
  }
  
  // 保存最后一块
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// RAG语义搜索
export async function ragSearch(
  query: string, 
  embeddedChunks: EmbeddedChunk[], 
  threshold: number = 0.3,
  maxResults: number = 5
): Promise<RAGSearchResult[]> {
  if (embeddedChunks.length === 0) {
    return [];
  }

  await embeddingService.initialize();

  // 查询向量化
  const queryEmbedding = await embeddingService.embedSingle(query);
  
  // 计算所有相似度
  const similarities = embeddingService.calculateSimilarities(
    queryEmbedding,
    embeddedChunks.map(chunk => chunk.embedding)
  );

  // 组合结果并排序
  const results: RAGSearchResult[] = embeddedChunks
    .map((chunk, index) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      sourceName: chunk.sourceName,
      content: chunk.content,
      similarity: Math.round(similarities[index] * 100) / 100, // 保留2位小数
      metadata: chunk.metadata
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return results;
}
