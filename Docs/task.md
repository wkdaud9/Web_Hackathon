# 해커톤 웹 사이트 구현 작업 목록

## 1. 기획 및 계획 (PLANNING)
- [x] Data 폴더 확인 및 파일 내용 파악
- [x] 웹 사이트 기본 기능 요구사항 도출
- [x] Vercel 배포 및 제출물 요구사항을 반영한 구현 계획 수정 (implementation_plan.md)

## 2. 환경 세팅 및 공통 요소 개발 (EXECUTION - 기초)
- [ ] Vite + React 프로젝트 생성 (`/Users/mac/Desktop/Web_Hackathon`)
- [ ] Git 저장소 초기화 및 첫 커밋 (GitHub 연동 준비)
- [ ] 라우팅(React Router) 세팅 및 공통 레이아웃(GNB, Footer) 개발
- [ ] 로컬 스토리지(`localStorage`) 기반 초기 데이터 시딩(Seeding) 로직 구현

## 3. 핵심 페이지 및 기능 구현 (EXECUTION - 기능)
- [ ] 메인 페이지 (`/`) 개발: 3가지 진입점 카드 및 애니메이션
- [ ] 해커톤 목록 페이지 (`/hackathons`) 개발: 상태/태그 필터링
- [ ] 해커톤 상세 페이지 (`/hackathons/:slug`) 개발: 7개 필수 탭, 데이터 연동
- [ ] 팀원 모집 페이지 (`/camp`) 개발: 팀 리스트, 팀 생성 폼
- [ ] 랭킹 페이지 (`/rankings`) 개발: 리더보드 테이블 구성

## 4. 확장 기능 및 UX 개선 (EXECUTION - 고도화)
- [ ] `ui-ux-pro-max` 스킬이 제안한 디자인 시스템(다크 모드 컬러, DM Sans & Space Grotesk 폰트) 일괄 적용
- [ ] 사용자 경험(UX) 강화를 위한 모던 UI(Framer Motion 등을 활용한 마이크로 인터랙션) 적용
- [ ] 반응형 브라우저 최적화

## 5. 배포 및 제출물 준비 (VERIFICATION & DEPLOY)
- [ ] Vercel 연동 및 배포 진행 (`vercel` CLI 활용 혹은 GitHub 연동)
- [ ] 1차 제출용 기획서 초안 작성
- [ ] PDF 변환용 최종 솔루션 설명 자료 텍스트/마크다운 추출
- [ ] 최종 테스트 및 디버깅
