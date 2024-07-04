export function Loading() {
  return (
    <div className="flex justify-center align-middle bg-primary">
      <div className="w-screen max-w-[30rem] h-screen relative">
        <img src="/images/logo.png" alt="ロゴ" className="w-full" />
        <div
          className="absolute bottom-6 right-2.5 text-black [&>span]:text-[40px] 
      [&>span]:text-black [&>span]:inline-block [&>span]:[font-family:kaisei_HarunoUmi]"
        >
          <span className="animate-wave-animation [animation-delay:0s]">L</span>
          <span className="animate-wave-animation [animation-delay:0.1s]">o</span>
          <span className="animate-wave-animation [animation-delay:0.2s]">a</span>
          <span className="animate-wave-animation [animation-delay:0.3s]">d</span>
          <span className="animate-wave-animation [animation-delay:0.4s]">i</span>
          <span className="animate-wave-animation [animation-delay:0.5s]">n</span>
          <span className="animate-wave-animation [animation-delay:0.6s]">g</span>
          <span className="animate-wave-animation [animation-delay:0.7s]">.</span>
          <span className="animate-wave-animation [animation-delay:0.8s]">.</span>
          <span className="animate-wave-animation [animation-delay:0.9s]">.</span>
        </div>
      </div>
    </div>
  );
}
