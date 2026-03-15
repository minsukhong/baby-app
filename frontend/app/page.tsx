export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <h1 className="text-4xl font-bold text-pink-500 mb-4">
        아기 케어 앱
      </h1>
      <p className="text-gray-600 text-lg">
        신생아 육아를 도와주는 웹 애플리케이션
      </p>
      <div className="mt-8 p-4 bg-white rounded-xl shadow text-center">
        <p className="text-sm text-gray-400">개발 서버 정상 실행 중</p>
      </div>
    </main>
  )
}
