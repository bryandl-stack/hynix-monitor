# hynix-monitor

SK하이닉스 가격을 4개 시장에서 모아 원화 기준으로 실시간 비교하는 대시보드.

- **KRX** 000660 · **NXT**(넥스트레이드) · **NASDAQ ADR** SKHY(×10) · **Binance 선물** SKHYUSDT(×10)
- 환율: 하나은행 고시환율 (주말 동결 표시)
- Binance는 WebSocket 틱 실시간, 나머지는 5초(장중)/30초(장외) 폴링
- 30일 원화 환산 비교 차트 (NXT는 일봉 미제공으로 카드만)

## 실행

    npm install
    npm run dev        # http://localhost:3000

## 점검

    npm test           # 유닛 테스트
    npm run probe      # 업스트림 API 5종 생존 확인

## 주의

비공식 공개 API(네이버·Yahoo)를 사용하므로 스키마가 바뀔 수 있다.
깨지면 `npm run probe`로 어느 소스가 죽었는지 먼저 확인할 것.
