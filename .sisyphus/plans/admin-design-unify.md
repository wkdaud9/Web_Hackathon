# AdminDashboard 디자인 통일 작업 계획

## TL;DR

> **Quick Summary**: AdminDashboard 페이지의 스타일을 MyPage와 통일하여 전체 사이트의 디자인 일관성 확보
> 
> **Deliverables**:
> - AdminDashboard.tsx 스타일 수정 완료
> - Sticky 헤더 바 추가
> - 카드 border-radius 및 shadow 통일
> - 배경 장식 요소 제거
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - 단일 파일 수정
> **Critical Path**: Task 1 → Final Verification

---

## Context

### Original Request
관리자 페이지(AdminDashboard)의 디자인이 다른 페이지들과 너무 달라서 MyPage 스타일로 통일하고 싶음. 다른 페이지는 절대 수정하지 않고 AdminDashboard만 수정.

### Interview Summary
**Key Discussions**:
- 기준 페이지: MyPage (마이페이지)
- 변경 범위: 스타일만 변경 (레이아웃/기능 구조 유지)
- 배경 장식 요소(blur 원형): 제거로 결정

**Research Findings**:
- MyPage 패턴: sticky header, max-w-[1240px], rounded-[40px] cards, shadow-[0_8px_40px_rgba(0,0,0,0.03)]
- AdminDashboard 현재: max-w-[1400px], rounded-[28px]/[36px] 혼재, 장식적 blur 배경

### Metis Review
**Identified Gaps** (addressed):
- max-width 값 명확화: 1240px로 확정
- 자식 컴포넌트 경계: AdminDashboard에 별도 자식 컴포넌트 없음, className만 수정
- 수용 기준 상세화: 아래 정의됨

---

## Work Objectives

### Core Objective
AdminDashboard.tsx의 스타일 클래스를 MyPage 패턴으로 교체하여 디자인 일관성 확보

### Concrete Deliverables
- `src/pages/AdminDashboard.tsx` 파일 수정

### Definition of Done
- [ ] AdminDashboard가 MyPage와 시각적으로 일관된 스타일을 가짐
- [ ] 라이트/다크 모드 모두 정상 동작
- [ ] 기존 기능(해커톤 선택, 제출물 표시) 그대로 동작

### Must Have
- Sticky 헤더 바 (MyPage와 동일한 구조)
- 카드 border-radius `rounded-[40px]` 통일
- 카드 shadow `shadow-[0_8px_40px_rgba(0,0,0,0.03)]` 적용
- max-width `1240px`로 변경
- 배경 장식 요소(blur) 제거
- 다크모드 스타일 일관성

### Must NOT Have (Guardrails)
- ❌ 다른 페이지 파일 수정 (HomePage, MyPage, HackathonsPage 등)
- ❌ 컴포넌트 파일 수정 (components/ 디렉토리)
- ❌ 레이아웃/기능 구조 변경 (3단 그리드, 해커톤 목록/제출물 표시 구조 유지)
- ❌ 새로운 CSS 파일이나 모듈 추가
- ❌ 새로운 breakpoint 추가

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (프로젝트에 테스트 환경 있음)
- **Automated tests**: NO (UI 스타일 변경이므로 시각적 QA로 검증)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Single Task):
└── Task 1: AdminDashboard.tsx 스타일 통일 [visual-engineering]

Wave FINAL (After ALL tasks — verification):
├── Task F1: 스타일 일관성 검증 (visual comparison)
├── Task F2: 다크모드 검증
├── Task F3: 반응형 검증
└── Task F4: 기능 동작 검증
-> Present results -> Get explicit user okay
```

### Agent Dispatch Summary

- **Wave 1**: **1 task** — T1 → `visual-engineering`
- **FINAL**: **4 tasks** — F1-F4 → verification

---

## TODOs

- [ ] 1. AdminDashboard.tsx 스타일 MyPage 패턴으로 통일

  **What to do**:
  1. 전체 wrapper 스타일 변경:
     - 현재: `className="w-full max-w-[1400px] mx-auto pb-20 relative"`
     - 목표: `className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300"`
  
  2. 배경 장식 요소 제거 (라인 41-43):
     ```tsx
     {/* 삭제할 부분 */}
     <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-cta/5 rounded-full blur-[100px] -z-10" />
     <div className="absolute bottom-[0px] left-[-100px] w-[300px] h-[300px] bg-cta/5 rounded-full blur-[80px] -z-10" />
     ```
  
  3. Sticky 헤더 바 추가 (MyPage 패턴):
     ```tsx
     {/* Header with Title Only */}
     <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
       <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4">
         <div className="flex items-center gap-6">
           <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors">관리자 페이지</h1>
         </div>
       </div>
     </div>
     ```
  
  4. 기존 헤더 섹션(라인 46-56) 제거 또는 축소
  
  5. 컨텐츠 영역 wrapper 추가:
     ```tsx
     <motion.div className="max-w-[1240px] mx-auto px-6 py-10 pb-24">
       {/* 기존 컨텐츠 */}
     </motion.div>
     ```
  
  6. Stats Cards 스타일 통일:
     - 현재: `rounded-[28px]`
     - 목표: `rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] dark:shadow-none`
  
  7. 해커톤 목록 카드 스타일 통일:
     - 현재: `rounded-[36px]`
     - 목표: `rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] dark:shadow-none`
  
  8. 제출물 영역 카드 스타일 통일:
     - 현재: `rounded-[40px]` (이미 맞음), `rounded-[32px]` (내부)
     - 목표: shadow 추가, 내부 카드 스타일 확인

  **Must NOT do**:
  - 다른 파일 수정
  - 기능 로직 변경
  - 레이아웃 구조 변경 (3단 그리드 유지)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 스타일 변경 작업으로 프론트엔드/디자인 전문성 필요
  - **Skills**: `[]`
    - 추가 스킬 불필요 (단일 파일 스타일 수정)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (단일 작업)
  - **Blocks**: F1, F2, F3, F4
  - **Blocked By**: None

  **References** (CRITICAL):

  **Pattern References** (existing code to follow):
  - `src/pages/MyPage.tsx:137-146` - Sticky 헤더 바 패턴 (정확한 클래스명 복사)
  - `src/pages/MyPage.tsx:156` - 카드 스타일 패턴 (`rounded-[40px]`, shadow)
  - `src/pages/MyPage.tsx:138` - 전체 wrapper 스타일

  **Target File**:
  - `src/pages/AdminDashboard.tsx` - 수정 대상 파일

  **WHY Each Reference Matters**:
  - MyPage.tsx:137-146: sticky 헤더의 정확한 클래스 구조와 다크모드 스타일
  - MyPage.tsx:156: 카드의 border-radius, shadow, border 패턴
  - MyPage.tsx:138: min-h-screen, bg-white dark:bg-transparent 패턴

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: [Happy path — 라이트 모드에서 스타일 통일 확인]
    Tool: Playwright
    Preconditions: 
      - 개발 서버 실행 (npm run dev 또는 bun dev)
      - 라이트 모드 설정
    Steps:
      1. http://localhost:5173/admin 접속
      2. Sticky 헤더 존재 확인: `div.sticky.top-0` 선택자
      3. 헤더 텍스트 확인: "관리자 페이지" 텍스트 존재
      4. 스크롤 시 헤더 고정 확인
      5. 카드 border-radius 확인: computed style에서 border-radius: 40px
      6. 배경 blur 요소 없음 확인: `.blur-[100px]` 선택자 없음
      7. 전체 페이지 스크린샷 캡처
    Expected Result: 
      - Sticky 헤더 존재
      - 모든 카드 rounded-[40px]
      - 배경 blur 요소 없음
    Failure Indicators: 
      - 헤더가 스크롤 시 사라짐
      - 카드 border-radius가 40px가 아님
      - blur 요소가 여전히 존재
    Evidence: .sisyphus/evidence/task-1-light-mode-style.png

  Scenario: [다크 모드에서 스타일 확인]
    Tool: Playwright
    Preconditions: 
      - 개발 서버 실행
      - 다크 모드 설정 (prefers-color-scheme: dark)
    Steps:
      1. http://localhost:5173/admin 접속 (다크 모드)
      2. 헤더 배경 확인: `bg-neutral-900/80` 클래스 또는 rgba 배경
      3. 카드 배경 확인: `bg-neutral-800` 클래스
      4. 텍스트 색상 확인: 흰색 계열
      5. 전체 페이지 스크린샷 캡처
    Expected Result: 
      - 다크 모드 배경/텍스트 색상 정상
      - 대비 충분 (읽기 가능)
    Failure Indicators: 
      - 배경이 여전히 밝은 색
      - 텍스트가 보이지 않음
    Evidence: .sisyphus/evidence/task-1-dark-mode-style.png

  Scenario: [기능 동작 확인 — 해커톤 선택]
    Tool: Playwright
    Preconditions: 개발 서버 실행, 테스트 데이터 존재
    Steps:
      1. http://localhost:5173/admin 접속
      2. 해커톤 목록에서 첫 번째 항목 클릭
      3. 오른쪽 제출물 영역이 해당 해커톤으로 필터링되는지 확인
      4. 다른 해커톤 클릭 시 제출물 목록 변경 확인
    Expected Result: 
      - 해커톤 선택 시 제출물 필터링 동작
      - 선택된 해커톤 하이라이트 표시
    Failure Indicators: 
      - 클릭해도 제출물 목록 변경 없음
      - 선택 상태 표시 안됨
    Evidence: .sisyphus/evidence/task-1-hackathon-select.png
  ```

  **Commit**: YES
  - Message: `style(admin): unify AdminDashboard design with MyPage pattern`
  - Files: `src/pages/AdminDashboard.tsx`
  - Pre-commit: `bun run build` (빌드 에러 없음 확인)

---

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE.

- [ ] F1. **스타일 일관성 검증** — `visual-engineering`
  AdminDashboard와 MyPage를 나란히 비교. 헤더 스타일, 카드 스타일, 색상 일치 확인. 스크린샷 비교.
  Output: `Style Match [Y/N] | Details | VERDICT: APPROVE/REJECT`

- [ ] F2. **다크모드 검증** — `quick`
  다크모드에서 AdminDashboard 전체 페이지 확인. 배경, 텍스트, 카드 색상 정상 여부.
  Output: `Dark Mode [PASS/FAIL] | Issues | VERDICT`

- [ ] F3. **반응형 검증** — `quick`
  모바일(375px), 태블릿(768px), 데스크탑(1440px) 뷰포트에서 레이아웃 깨짐 확인.
  Output: `Mobile [OK/FAIL] | Tablet [OK/FAIL] | Desktop [OK/FAIL] | VERDICT`

- [ ] F4. **기능 동작 검증** — `quick`
  해커톤 선택, 제출물 필터링 기능 정상 동작 확인. 기존 기능 손상 없음.
  Output: `Functions [N/N working] | VERDICT`

---

## Commit Strategy

- **Task 1**: `style(admin): unify AdminDashboard design with MyPage pattern` — AdminDashboard.tsx

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: Build successful, no errors
bun run dev    # Expected: Dev server starts, http://localhost:5173/admin accessible
```

### Final Checklist
- [ ] Sticky 헤더 바 존재 (스크롤 시 고정)
- [ ] 모든 카드 `rounded-[40px]`
- [ ] 카드 shadow `shadow-[0_8px_40px_rgba(0,0,0,0.03)]` 적용
- [ ] 배경 blur 장식 요소 제거됨
- [ ] 다크모드 정상 동작
- [ ] 기존 기능 (해커톤 선택, 제출물 표시) 정상 동작
- [ ] 다른 페이지 파일 수정 없음
