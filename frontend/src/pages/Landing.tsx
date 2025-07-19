import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto px-4 py-8">
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500 via-cyan-950 to-yellow-500 rounded-2xl mt-24">
        <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 text-center drop-shadow-lg">
          Team Draft LOL
        </h1>
        <p className="text-xl md:text-2xl text-white mb-10 text-center">
          최고의 팀 드래프트, 지금 시작해보세요!
        </p>
        <div className="flex gap-6">
          <button
            type="button"
            className="px-8 py-4 bg-black text-white rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-800 transition"
            onClick={() => navigate("/signup")}
          >
            SIGN UP
          </button>
          <button
            type="button"
            className="px-8 py-4 bg-white text-black rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-200 transition"
            onClick={() => navigate("/login")}
          >
            SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
