export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Chrome Extension
        </h1>
        <p className="text-gray-600 mb-6">
          Next.js 14 + TypeScript + Tailwind CSS 4로 만든 크롬 익스텐션입니다.
        </p>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
          시작하기
        </button>
      </div>
    </div>
  );
}
