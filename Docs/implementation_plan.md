# 해커톤 플랫폼 웹 사이트 구현 및 배포 계획

제공된 `Data` 폴더의 초기 데이터와 기획안을 바탕으로 프론트엔드 웹 앱을 구현하고, **팀만의 아이디어를 추가한 UX 개선** 및 **Vercel을 통한 완벽한 배포**를 수행하는 것이 목표입니다.

## User Review Required
> [!IMPORTANT]
> 새롭게 추가된 규칙에 따라 다음 사항들을 확정합니다.
> 1. **배포 플랫폼:** Vercel (의존성 없이 잘 배포되도록 설정)
> 2. **저장소:** 로컬에서 Git을 초기화하고, 추후 사용자가 사용할 수 있도록 가이드 제공
> 3. **데이터:** 외부 API/DB 없이 철저하게 `localStorage` 기반 상태 관리 구축
> 4. **제출물 준비:** 1차 기획서와 최종 솔루션 PDF 생성을 돕기위해, 프로젝트 내에 `docs/` 폴더를 두고 마크다운 형식으로 먼저 초안을 작성하여 제공하겠습니다. 이를 PDF로 변환해 제출하시면 됩니다.

위 내용이 맞는지 확인 부탁드립니다.

## Proposed Changes

### 1. 프로젝트 환경 및 Git 연동
- Vite를 이용한 React + TypeScript 환경 구성
- Git 초기화 후 기본 템플릿 커밋
- Vercel 배포를 위한 `vercel.json` 세팅 (SPA 라우팅 폴백 설정)

### 2. 로컬 스토리지 데이터 모델링
- 제공된 4개의 JSON 파일(`public_hackathons.json`, `public_hackathon_detail.json`, `public_teams.json`, `public_leaderboard.json`)을 로드.
- 로딩 시 `localStorage`에 데이터가 없으면 시딩(Seeding), 있다면 그 데이터를 활용하여 CRUD(Create, Read, Update, Delete)를 수행하는 커스텀 훅 및 API 계층(`src/services`) 생성.

### 3. 컴포넌트 및 페이지 구현 (UX 고도화 포함)
- **디자인 시스템 (ui-ux-pro-max 적용):**
  - **Style:** Vibrant & Block-based (모던하고 에너제틱한 다크 모드)
  - **Colors:** Background (`#0F172A`), Primary (`#1E293B`), CTA (`#22C55E`), Text (`#F8FAFC`)
  - **Typography:** 헤딩 `Space Grotesk`, 본문 `DM Sans` 적용
- **공통 컴포넌트:** 매력적인 네비게이션 바, 로딩 스피너, 에러 바운더리.
- **메인 페이지 (`/`):** 매력적인 3D 스타일 또는 호버 효과가 적용된 카드 UI 중심의 랜딩.
- **해커톤 목록 (`/hackathons`):** 필터와 검색이 용이한 리스트 뷰.
- **해커톤 상세 (`/hackathons/:slug`):** 필수 7개 섹션을 탭 형태로 제공. 특히 *Submit(제출)* 섹션에서 폼 데이터를 입력하면 `localStorage`에 저장 및 연동되도록 UX 설계.
- **팀원 모집 (`/camp`):** 해커톤 파라미터 기반 필터링 및 연락처 링크 연동 중심 UI.
- **랭킹 (`/rankings`):** 전체 유저 기반 리더보드 테이블 설계.

### 4. Vercel 배포 및 문서화
- `npm run build` 스크립트를 통해 에러가 없는지 Vercel 배포 전 로컬 테스트.
- 프로젝트 최상단 `docs/` 디렉토리에 **1차 기획서(plan.md)** 및 **솔루션 설명 자료(solution.md)** 뼈대와 스크립트 작성.

## Verification Plan

### Automated Tests
- 타입스크립트 컴파일(`tsc --noEmit`) 및 번들러 빌드 에러 모니터링.

### Manual Verification
1. `npm run dev` 구동 후 브라우저에서 모든 라우트 탐색 및 스토리지 연동 확인.
2. 폼(팀 생성, 제출 등) 입력 시 새로고침해도 데이터가 유지되는지 브라우저 `Application > LocalStorage` 탭에서 확인.
3. Vercel 배포가 성공적으로 이루어지고, 배포된 URL에서 외부 접근 시 문제 없이 동작하는지 테스트.
4. `docs/` 내의 마크다운 내용이 제출 가능한 퀄리티인지 사용자와 최종 리뷰 진행.
