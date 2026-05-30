export const BIRTH_PROFILE = {
  date: '1996-08-24', time: '06:35', gender: 'female' as const,
  summary: '병자년 · 계사일 · 묘시 · 여명',
}

const OVERALL = ['전반적으로 순조로운 하루입니다. 마음가짐을 편하게 가져가세요.','작은 행운이 찾아오는 날 — 평소 미뤄둔 일 하나씩 처리하기 좋습니다.','차분하게 하루를 보내면 저녁에 만족감이 큽니다.','직감을 믿어도 좋은 날입니다. 느낌이 오는 선택을 해보세요.','주변 사람들과의 관계가 부드러워지는 날입니다.','오전에 에너지가 높으니 중요한 일은 앞쪽에 배치하세요.']
const DAILY = ['오늘은 따뜻한 음료 한 잔이 기분 전환에 좋습니다.','점심은 평소와 다른 메뉴로 바꿔보면 오후가 상쾌해집니다.','퇴근 후 좋아하는 음악을 들으며 휴식 시간을 가져보세요.','가벼운 산책이나 창가에서 햇살 쬐기 — 기분이 한결 나아집니다.','오래 연락 안 한 친구에게 짧은 메시지를 보내보세요.','집 안 작은 정리·정돈이 마음까지 가볍게 만들어 줍니다.','저녁은 일찍 자는 것도 좋은 선택입니다. 내일을 위해 충전하세요.','작은 간식이나 디저트로 스스로에게 선물하는 하루를 보내세요.']
const WORK = ['ICP-MS·HPLC 장비 Calibration을 먼저 확인하면 하루가 편해집니다.','Batch 순서를 미리 정리하면 처리 속도가 빨라집니다.','오늘은 표준곡선 R² 값이 안정적으로 나올 확률이 높습니다.','샘플 ID 더블체크에 특히 행운이 따르는 날입니다.','꼼꼼한 기록이 나중에 큰 도움이 됩니다.','동료와 잠깐의 대화가 막힌 업무의 실마리가 될 수 있습니다.']
const HEALTH = ['묘시(卯時)생 — 오전 에너지가 강합니다. 오후에는 짧은 휴식을 취하세요.','눈의 피로를 줄이려면 20-20-20 규칙을 지켜보세요.','물을 자주 마시면 집중력과 피부 모두 좋아집니다.','목·어깨 스트레칭 5분이면 몸이 한결 가벼워집니다.','충분한 수면이 내일 운세를 좌우합니다.']
const LOVE = ['주변 사람에게 따뜻한 말 한마디가 좋은 인연을 불러옵니다.','연인·가족과의 대화에서 듣는 쪽에 집중하면 관계가 깊어집니다.','오늘은 먼저 연락하는 쪽이 더 행복해지는 날입니다.','혼자 있는 시간도 충분히 소중합니다. 자신을 아끼세요.']
const CAUTION = ['감정적으로 성급한 결정은 내일로 미루는 것이 좋습니다.','과식·과음은 내일 컨디션을 떨어뜨릴 수 있습니다.','중요한 대화는 충분히 생각한 뒤에 하세요.','지출은 계획된 범위 안에서 — 충동구매에 주의하세요.']

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}
function pick(pool: string[], date: string, cat: number): string {
  const seed = hash(`${BIRTH_PROFILE.date}T${BIRTH_PROFILE.time}:${BIRTH_PROFILE.gender}:${date}:${cat}`)
  return pool[seed % pool.length]
}

export interface FortuneItem { label: string; text: string; color: string }
export function getPersonalFortunes(date: string): FortuneItem[] {
  return [
    { label: '전체운', text: pick(OVERALL,  date, 1), color: 'text-cyan-400'   },
    { label: '일상운', text: pick(DAILY,    date, 2), color: 'text-pink-400'   },
    { label: '업무운', text: pick(WORK,     date, 3), color: 'text-green-400'  },
    { label: '건강운', text: pick(HEALTH,   date, 4), color: 'text-blue-400'   },
    { label: '인연운', text: pick(LOVE,     date, 5), color: 'text-purple-400' },
    { label: '주의',   text: pick(CAUTION,  date, 6), color: 'text-yellow-400' },
  ]
}
