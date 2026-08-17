// 업스트림 생존 확인. API 스키마가 바뀌면 여기서 먼저 알 수 있다.
const targets = [
  ['naver-quote', 'https://m.stock.naver.com/front-api/realTime/marketPrice?itemCodes=000660&endType=stock&stockType=domestic', (j) => j.result.datas[0].closePriceRaw],
  ['naver-daily', 'https://m.stock.naver.com/front-api/chart/domestic/stock/end?code=000660&chartInfoType=item&scriptChartType=candleDay', (j) => j.result.priceInfos.length],
  ['naver-fx', 'https://m.stock.naver.com/front-api/marketIndex/prices?category=exchange&reutersCode=FX_USDKRW&page=1', (j) => j.result[0].closePrice],
  ['yahoo-adr', 'https://query1.finance.yahoo.com/v8/finance/chart/SKHY?interval=1d&range=5d', (j) => j.chart.result[0].meta.regularMarketPrice],
  ['binance', 'https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=SKHYUSDT', (j) => j.lastPrice],
  ['yahoo-tsmc-tw', 'https://query1.finance.yahoo.com/v8/finance/chart/2330.TW?interval=1d&range=5d', (j) => j.chart.result[0].meta.regularMarketPrice],
  ['yahoo-tsmc-adr', 'https://query1.finance.yahoo.com/v8/finance/chart/TSM?interval=1d&range=5d', (j) => j.chart.result[0].meta.regularMarketPrice],
  ['yahoo-usdtwd', 'https://query1.finance.yahoo.com/v8/finance/chart/TWD%3DX?interval=1d&range=5d', (j) => j.chart.result[0].meta.regularMarketPrice],
];

for (const [name, url, pick] of targets) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const j = await res.json();
    console.log(`✓ ${name}: HTTP ${res.status}, sample=${pick(j)}`);
  } catch (err) {
    console.log(`✗ ${name}: ${err}`);
    process.exitCode = 1;
  }
}
