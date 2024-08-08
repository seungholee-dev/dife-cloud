# Dife AWS CDK

## Github Rules

We follow Conventional Commits

Reference

-   [A Simplified Convention for Naming Branches and Commits in Git](https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4)

-   [Naming conventions for Git Branches — a Cheatsheet](https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534)

### Commits

#### Template

> git commit -m 'category(field): do something'
> git commit -m 'feat(profile): add profile picture upload'

#### prefix

-   feat: 새로운 기능 구현
-   fix: 버그 수정
-   refactor: 코드 개선 및 리팩토링
-   docs: 문서화 작업
-   chore: 비즈니스 로직과 어플리케이션 로직과 연관 없는 각종 작업들
-   style: 코드의 포맷 및 오타 수정 등
-   test: 테스트 작성
-   perf: 성능 작업
-   ci: CI 작업
-   build: 빌드 및 패키지 관리 등
-   revert: 이전 변경 사항을 되돌리는 revert

### Branches

> 로컬 브랜치는 prod로 Merge하는 것을 원칙으로 한다.

### Branch 이름 예시

> feat/T-123-new-login-system
> build/v2.0.1

#### Branch 이름

> Commit prefix와 동일

### Others

-   PR이 Merge가 되면 사용했던 브랜치는 삭제한다.
-   코드 리뷰를 위해 모든 팀원을 Reviewer 지정을 한다.
-   코드의 가독성과 손쉬운 Documentation 관리를 위해 주석은 가능하면 작성하지 않는다.
