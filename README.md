# Team Draft - League of Legends

League of Legends 팀 구성 도구입니다. 플레이어들을 풀에 추가하고 팀을 구성할 수 있습니다.

## 🚀 배포 URL

## 🛠️ 기술 스택

### Frontend

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express
- MongoDB
- JWT Authentication

## 📁 프로젝트 구조

```
team-draft-lol/
├── frontend/          # React 프론트엔드
├── backend/           # Node.js 백엔드
├── .gitignore
└── README.md
```

## 🚀 로컬 개발 환경 설정

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## 🔧 환경 변수

### Frontend (.env.local)

```
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## 📝 주요 기능

- 사용자 인증 (회원가입/로그인)
- 플레이어 풀 관리
- 팀 구성 및 드래프트
- 게임 기록 저장
- 랭킹 시스템

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
