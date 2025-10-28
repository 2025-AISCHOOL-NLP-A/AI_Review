import re
import random
from typing import List, Dict
from collections import Counter

class SentimentService:
    def __init__(self):
        # 간단한 감정 사전 (실제로는 더 정교한 모델 사용 권장)
        self.positive_words = {
            '좋다', '훌륭하다', '최고', '만족', '추천', '친절', '맛있다', '깨끗하다', '편리하다',
            '빠르다', '정확하다', '완벽하다', '감사', '고마워', '사랑', '행복', '기쁘다',
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love',
            'happy', 'satisfied', 'recommend', 'best', 'awesome', 'fantastic'
        }
        
        self.negative_words = {
            '나쁘다', '최악', '불만', '화나다', '짜증', '실망', '별로', '맛없다', '더럽다',
            '불편하다', '느리다', '부정확하다', '문제', '오류', '고장', '싫다', '슬프다',
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'angry',
            'disappointed', 'frustrated', 'problem', 'issue', 'broken', 'slow'
        }
        
        self.neutral_words = {
            '보통', '그냥', '평범', '무난', '괜찮다', '그럭저럭', '적당하다',
            'okay', 'normal', 'average', 'fine', 'alright', 'decent'
        }

    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리"""
        # 소문자 변환
        text = text.lower()
        
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        
        # 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
        text = re.sub(r'[^\w\s가-힣]', ' ', text)
        
        # 연속된 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

    async def analyze_sentiment(self, text: str) -> Dict:
        """감정 분석"""
        try:
            # 텍스트 전처리
            processed_text = self.preprocess_text(text)
            words = processed_text.split()
            
            # 감정 점수 계산
            positive_score = 0
            negative_score = 0
            neutral_score = 0
            
            for word in words:
                if any(pos_word in word for pos_word in self.positive_words):
                    positive_score += 1
                elif any(neg_word in word for neg_word in self.negative_words):
                    negative_score += 1
                elif any(neu_word in word for neu_word in self.neutral_words):
                    neutral_score += 1
            
            # 총 점수
            total_score = positive_score + negative_score + neutral_score
            
            if total_score == 0:
                # 감정 단어가 없는 경우 중립으로 처리
                positive_ratio = 0.4
                negative_ratio = 0.2
                neutral_ratio = 0.4
            else:
                positive_ratio = positive_score / total_score
                negative_ratio = negative_score / total_score
                neutral_ratio = neutral_score / total_score
            
            # 정규화 (합이 1이 되도록)
            total_ratio = positive_ratio + negative_ratio + neutral_ratio
            if total_ratio > 0:
                positive_ratio /= total_ratio
                negative_ratio /= total_ratio
                neutral_ratio /= total_ratio
            
            # 주요 감정 결정
            if positive_ratio > negative_ratio and positive_ratio > neutral_ratio:
                sentiment = "긍정"
                confidence = positive_ratio
            elif negative_ratio > positive_ratio and negative_ratio > neutral_ratio:
                sentiment = "부정"
                confidence = negative_ratio
            else:
                sentiment = "중립"
                confidence = neutral_ratio
            
            return {
                "sentiment": sentiment,
                "confidence": confidence,
                "positive": round(positive_ratio * 100, 1),
                "neutral": round(neutral_ratio * 100, 1),
                "negative": round(negative_ratio * 100, 1)
            }
            
        except Exception as e:
            print(f"감정 분석 오류: {e}")
            # 기본값 반환
            return {
                "sentiment": "중립",
                "confidence": 0.5,
                "positive": 40.0,
                "neutral": 40.0,
                "negative": 20.0
            }

    async def generate_insights(self, sentiment_result: Dict, keywords: List[Dict]) -> List[str]:
        """인사이트 생성"""
        insights = []
        
        try:
            # 감정 기반 인사이트
            sentiment = sentiment_result["sentiment"]
            confidence = sentiment_result["confidence"]
            
            if sentiment == "긍정":
                insights.append(f"전체적으로 긍정적인 반응이 {confidence:.1%} 확률로 나타났습니다.")
                if sentiment_result["positive"] > 60:
                    insights.append("고객 만족도가 매우 높은 수준입니다.")
            elif sentiment == "부정":
                insights.append(f"부정적인 의견이 {confidence:.1%} 확률로 감지되었습니다.")
                insights.append("개선이 필요한 부분들을 검토해보시기 바랍니다.")
            else:
                insights.append("중립적인 반응이 주를 이루고 있습니다.")
            
            # 키워드 기반 인사이트
            if keywords:
                top_keywords = [kw["word"] for kw in keywords[:5]]
                insights.append(f"주요 언급 키워드: {', '.join(top_keywords)}")
                
                # 특정 키워드 기반 인사이트
                keyword_text = ' '.join(top_keywords).lower()
                
                if any(word in keyword_text for word in ['서비스', 'service', '직원', '친절']):
                    insights.append("서비스 품질에 대한 언급이 많습니다.")
                
                if any(word in keyword_text for word in ['맛', '음식', 'food', '요리']):
                    insights.append("음식 품질에 대한 관심이 높습니다.")
                
                if any(word in keyword_text for word in ['가격', 'price', '비용', '저렴', '비싸']):
                    insights.append("가격에 대한 의견이 자주 언급됩니다.")
                
                if any(word in keyword_text for word in ['위치', '접근', '교통', 'location']):
                    insights.append("위치나 접근성에 대한 언급이 있습니다.")
            
            # 기본 인사이트가 없는 경우
            if len(insights) < 2:
                insights.append("더 많은 데이터가 축적되면 더 정확한 분석이 가능합니다.")
            
            return insights[:5]  # 최대 5개 인사이트 반환
            
        except Exception as e:
            print(f"인사이트 생성 오류: {e}")
            return ["분석 중 오류가 발생했습니다. 다시 시도해주세요."]