import { useNavigate } from "react-router-dom";

const LogoutMessage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto px-4 py-8">
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500 via-cyan-950 to-yellow-500 rounded-2xl mt-24">
        <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 text-center drop-shadow-lg">
          !
        </h1>
        <p className="text-xl md:text-2xl text-white mb-10 text-center">
          로그인 후 이용할 수 있습니다
        </p>
        <div className="flex gap-6">
          <button
            type="button"
            className="px-8 py-4 bg-black text-white rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-800 transition"
            onClick={() => navigate("/login")}
          >
            로그인하기
          </button>
          <button
            type="button"
            className="px-8 py-4 bg-white text-black rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-200 transition"
            onClick={() => navigate("/")}
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutMessage;
