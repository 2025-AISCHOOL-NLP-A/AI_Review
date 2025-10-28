import base64
import io
import re
from typing import List, Dict
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import jieba
import numpy as np
from collections import Counter

class WordCloudService:
    def __init__(self):
        # 한국어 불용어 리스트
        self.korean_stopwords = {
            '되다', '들다', '등', '조금', '않다', '없다', '이다', '점', '것', '및', '높다', '는',
            '주다', '정말', '있다', '되어다', '요즘', '편이', '곳', '저', '번', '작다', '낮다', '진짜',
            '도', '아주', '개', '정도', '생각', '들', '의', '너무', '사람', '쓰다', '그냥', '오다', '또한',
            '가', '좀', '분', '을', '에', '보다', '나쁘다', '많다', '그런데', '제품', '이', '은', '사용', '와',
            '가다', '수', '하다', '좋다', '하지만', '그러나', '그렇다', '받다', '또', '그', '것들', '못', '때', '과',
            '크다', '잘', '적다', '아니다', '같다', '그리고', '별로', '매우', '를'
        }
        
        # 영어 불용어 리스트
        self.english_stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'very', 'really',
            'quite', 'just', 'only', 'also', 'even', 'still', 'more', 'most', 'much', 'many'
        }

    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리"""
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        
        # 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
        text = re.sub(r'[^\w\s가-힣]', ' ', text)
        
        # 연속된 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

    def extract_keywords(self, text: str, max_words: int = 100) -> List[Dict]:
        """키워드 추출 및 빈도 계산"""
        # 텍스트 전처리
        processed_text = self.preprocess_text(text)
        
        # 한국어 형태소 분석
        korean_words = []
        for word in jieba.cut(processed_text):
            word = word.strip()
            if (len(word) > 1 and 
                word not in self.korean_stopwords and 
                word not in self.english_stopwords and
                not word.isdigit()):
                korean_words.append(word)
        
        # 영어 단어 추출
        english_words = re.findall(r'\b[a-zA-Z]{2,}\b', processed_text.lower())
        english_words = [word for word in english_words if word not in self.english_stopwords]
        
        # 모든 단어 합치기
        all_words = korean_words + english_words
        
        # 빈도 계산
        word_freq = Counter(all_words)
        
        # 상위 키워드 반환
        keywords = []
        for word, freq in word_freq.most_common(max_words):
            keywords.append({
                "word": word,
                "frequency": freq,
                "weight": freq / max(word_freq.values()) if word_freq.values() else 0
            })
        
        return keywords

    async def generate_wordcloud(self, text: str, width: int = 800, height: int = 400, max_words: int = 100) -> Dict:
        """워드클라우드 생성"""
        try:
            # 키워드 추출
            keywords = self.extract_keywords(text, max_words)
            
            if not keywords:
                # 기본 워드클라우드 생성
                word_freq = {"분석": 10, "리뷰": 8, "데이터": 6, "없음": 4}
            else:
                # 키워드를 딕셔너리로 변환
                word_freq = {kw["word"]: kw["frequency"] for kw in keywords}
            
            # 워드클라우드 생성
            wordcloud = WordCloud(
                width=width,
                height=height,
                background_color='white',
                max_words=max_words,
                colormap='viridis',
                font_path=None,  # 시스템 기본 폰트 사용
                relative_scaling=0.5,
                min_font_size=10
            ).generate_from_frequencies(word_freq)
            
            # 이미지를 base64로 변환
            img_buffer = io.BytesIO()
            plt.figure(figsize=(width/100, height/100))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.tight_layout(pad=0)
            plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100)
            plt.close()
            
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "image_base64": img_base64,
                "keywords": keywords[:20],  # 상위 20개 키워드만 반환
                "status": "success"
            }
            
        except Exception as e:
            print(f"워드클라우드 생성 오류: {e}")
            return {
                "image_base64": "",
                "keywords": [],
                "status": f"error: {str(e)}"
            }