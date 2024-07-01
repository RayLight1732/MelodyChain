import { loginWithGoogle } from "@/libs/auth";

export default function Login() {
  return (
    <div
      className="h-screen grid"
      style={{
        gridTemplateRows: "fit-content(100%) fit-content(100%) fit-content(100%) 1fr 2fr",
      }}
    >
      <div className="flex justify-center items-center h-100 pt-6">
        <img src="/images/logo.png" alt="" />
      </div>
      <div className="w-[70%] mx-auto">
        <input className="w-full p-2.5 my-2.5 inline-block border border-solid border-gray-300 box-border leading-none" type="text" placeholder="メールアドレス" />
        <input className="w-full p-2.5 my-2.5 inline-block border border-solid border-gray-300 box-border leading-none" type="password" placeholder="パスワード" />
      </div>
      <button className="py-2.5 px-5 bg-[rgb(224,39,208)] text-primary rounded-md block mt-10 mx-auto" type="submit">
        ログイン
      </button>
      <div className="w-2/3 h-0.5 mx-auto mt-auto mb-0 bg-gray-500"></div>
      <button
        onClick={loginWithGoogle}
        className="before:w-5 before:h-5 before:mr-6 before:bg-google before:inline-block before:bg-contain before:align-middle
                    p-2 text-gray-500 font-bold text-lg border rounded border-solid block border-gray-500 bg-primary m-auto"
      >
        Googleで続ける
      </button>
    </div>
  );
}
