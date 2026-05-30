# 분석실 모바일 대시보드

Supabase에 저장된 실험실 데이터를 모바일에서 조회하는 웹 앱입니다.

## 기능

- **홈 대시보드**: 오늘/이번 주 업무 통계, 최근 업무일지
- **업무일지**: 날짜/키워드 필터, 무한 스크롤
- **샘플 현황**: 샘플 목록 조회
- **실험법 자료**: 파일 목록 + PDF/이미지/HWP 뷰어
- **통계**: 월별 업무·샘플 건수 차트, 장비 현황

## 로컬 실행

```bash
# 1. 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase URL과 Anon Key 입력

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

## Vercel 배포 방법

### 방법 A: Vercel CLI (터미널)

```bash
npm install -g vercel
vercel
```
배포 과정에서 환경변수 입력 요청 시:
- `VITE_SUPABASE_URL` → Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY` → Supabase anon key

### 방법 B: GitHub + Vercel 웹 대시보드 (권장)

1. **GitHub에 올리기**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   # GitHub에 새 저장소 만들고 push
   git remote add origin https://github.com/YOUR_NAME/lab-dashboard.git
   git push -u origin main
   ```

2. **Vercel 연결**
   - [vercel.com](https://vercel.com) 로그인 → **New Project**
   - GitHub 저장소 선택
   - **Root Directory**: `mobile-dashboard` (work log 폴더 안에 있는 경우)
   - **Framework Preset**: Vite (자동 감지됨)

3. **환경변수 설정** (Vercel 대시보드)
   - Settings → Environment Variables
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

4. **Deploy** 클릭 → 배포 완료

### Supabase 설정 주의사항

Supabase 대시보드 → **Authentication → URL Configuration**에서  
Vercel 배포 URL을 Allowed Origins에 추가:
```
https://your-app.vercel.app
```

또한 각 테이블의 RLS(Row Level Security)가 **비활성화**되어 있어야 데이터를 조회할 수 있습니다.
```sql
alter table work_logs disable row level security;
alter table samples disable row level security;
alter table equipment disable row level security;
alter table experiment_methods disable row level security;
```
