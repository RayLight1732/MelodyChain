import { useRouter } from "next/router";
import { Dispatch, ForwardedRef, MouseEventHandler, ReactElement, SetStateAction, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";

export function CustomDialog({ children, isOpen, onClose }: { isOpen: boolean; children?: ReactElement; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) {
      return;
    }
    if (isOpen) {
      if (dialogElement.hasAttribute("open")) {
        return;
      }
      dialogElement.showModal();
    } else {
      if (!dialogElement.hasAttribute("open")) {
        return;
      }
      dialogElement.close();
    }
  }, [isOpen]);

  return (
    <dialog className="!outline-none bg-opacity-0 bg-black backdrop:bg-opacity-50 backdrop:bg-black" onClick={onClose} ref={dialogRef}>
      <div
        className="bg-opacity-0"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </dialog>
  );
}

type ConfirmDialogFactory = (onConfirm: () => void, onCancel: () => void) => ReactElement;

export function usePageLeaveConfirmation(showDialog: () => boolean, dialogFactory: ConfirmDialogFactory): ReactElement {
  //参考
  //https://zenn.dev/leaner_dev/articles/20230303-detect_page_leaves_in_nextjs
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const nextURLRef = useRef<string | null>(null);
  const ignoreRef = useRef(false);
  const onConfirm = useCallback(() => {
    setOpen(false);
    const nextURL = nextURLRef.current;
    nextURLRef.current = null;
    if (nextURL) {
      router.push(nextURL);
    }
  }, [router, setOpen]);
  const onCancel = useCallback(() => {
    setOpen(false);
    ignoreRef.current = false;
  }, [setOpen]);

  useEffect(() => {
    console.log("use effect");
    // 1. App外ページへの遷移 or ブラウザリロード
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (showDialog()) {
        event.preventDefault();
      }
    };

    // 2. App内ページへの遷移
    const pageChangeHandler = (url: string) => {
      if (showDialog()) {
        if (!ignoreRef.current) {
          setOpen(true);
          nextURLRef.current = url;
          ignoreRef.current = true;
          throw "changeRoute aborted";
        } else {
          ignoreRef.current = false;
        }
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    router.events.on("routeChangeStart", pageChangeHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      router.events.off("routeChangeStart", pageChangeHandler);
    };
  }, [showDialog]);

  const element = useMemo(() => {
    return (
      <CustomDialog isOpen={isOpen} onClose={() => setOpen(false)}>
        {dialogFactory(onConfirm, onCancel)}
      </CustomDialog>
    );
  }, [onConfirm, onCancel, isOpen, dialogFactory]);
  if (isOpen) {
    console.log("element");
    return element;
  } else {
    return <></>;
  }
}

export function SpinningLoader({ className = "" }: { className?: String }) {
  return <div className={"border-4 border-black border-dotted rounded-full animate-spin " + className}></div>;
}

export function PlayButton({ className = "", playing, onClick }: { className?: string; playing: boolean; onClick?: MouseEventHandler<SVGSVGElement> }) {
  return playing ? (
    <svg onClick={onClick} className={"text-black " + className} viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="55" r="50" className=" stroke-black stroke-[10] fill-none" />
      <path d="M 72 78 L 72 32 L 62 32 L 62 78 Z"></path>
      <path d="M 37 78 L 37 32 L 47 32 L 47 78 Z"></path>
    </svg>
  ) : (
    <svg onClick={onClick} className={"text-black " + className} viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="55" r="50" className=" stroke-black stroke-[10] fill-none" />
      <path d="M 87 55 L 39 83 L 39 27 Z"></path>
    </svg>
  );
}

export function showFileChoosePopup(accept: string, onChange: (this: GlobalEventHandlers, ev: Event) => any) {
  // ファイル選択インプットを動的に作成
  const fileInput = document.createElement("input");
  fileInput.multiple = false;
  fileInput.type = "file";
  fileInput.accept = accept;
  fileInput.style.display = "none"; // インプットを非表示にする

  // ファイルが選択されたときのイベント
  fileInput.onchange = onChange;
  // クリックイベントを発生させる
  fileInput.click();
}

type CountableTextAreaProps = {
  defaultValue?: string;
  rows: number;
  maxLength: number;
  placeholder?: string;
  className?: string;
  id: string;
  pattern?: RegExp;
  required?: boolean;
  state: [string, Dispatch<SetStateAction<string>>];
};

export const CountableTextArea = forwardRef<HTMLDivElement, CountableTextAreaProps>(function CountableTextArea(
  { maxLength, rows, placeholder, className, id, pattern, required = false, defaultValue = "", state }: CountableTextAreaProps,
  ref?: ForwardedRef<HTMLDivElement>
) {
  const [value, setValue] = state;
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const showWarn = required && value.length == 0;
  return (
    <div className={className}>
      <div
        ref={ref}
        className={` cursor-text leading-tight p-2 rounded outline outline-1 focus-within:outline-2 ${
          showWarn
            ? "outline-[#ff9999] hover:outline-warn hover:focus-within:outline-warn focus-within:outline-warn "
            : "outline-accent hover:outline-gray-600 hover:focus-within:outline-blue-400 focus-within:outline-blue-400 "
        } `}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex">
          <p className={`text-left pr-3 text-sm mb-1 ${showWarn ? "text-[#ff9999]" : "text-gray-500"}`}>{placeholder}</p>
          <p className={"ml-auto text-right pr-3 text-sm mb-1 " + (value.length > maxLength || showWarn ? "text-red-400" : "text-gray-400")}>
            {value.length}/{maxLength}
          </p>
        </div>
        <textarea
          maxLength={maxLength}
          rows={rows}
          className="resize-none w-full focus:outline-none border-none block text-lg"
          value={value}
          onChange={(e) => {
            if (pattern && !pattern.test(e.target.value)) {
              return;
            }
            console.log(e.target.value);
            setValue(e.target.value);
          }}
          ref={inputRef}
          name={id}
        ></textarea>
      </div>
      <p className={`block p-1 mb-2 text-sm text-warn ${showWarn ? "visible" : "invisible"}`}>この項目は必須です</p>
    </div>
  );
});

//参考
//https://www.ey-office.com/blog_archive/2023/06/14/modern-infinite-scroll-seems-to-use-intersectionobserve/

/**
 * 無限スクロール用のプロパティ
 */
interface InfiniteScrollViewerProps {
  /**
   * すでにロードされた要素
   */
  loaded: ReactElement[];
  /**
   * 交差監視用のルート要素
   */
  root?: HTMLElement;
  /**
   * 次をロードする
   * @returns その次があるかどうか
   */
  loadNext: () => Promise<boolean>;
}

/**
 * 無限スクロール用のコンポーネント
 * @param {InfiniteScrollViewerProps} param0
 * @returns
 */
export function InfiniteScrollViewer({ loaded, root, loadNext }: InfiniteScrollViewerProps) {
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const isLoading = useRef(false);
  const hasNext = useRef(true);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading.current && hasNext.current) {
          isLoading.current = true;

          loadNext().then((result) => {
            isLoading.current = false;
            hasNext.current = result;
            console.log("end loading");
          });
        }
      },
      {
        root: root,
        threshold: 1.0,
      }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, []);

  return (
    <div>
      {loaded}
      <div ref={observerTarget}></div>
    </div>
  );
}

export function Panel({ selectors, nodes, initialState = 0 }: { selectors: string[]; nodes: ReactElement[]; initialState?: number }) {
  const [panelState, setPanelState] = useState(initialState);
  return (
    <>
      <div className="grid justify-between px-4 border-b border-secondary" style={{ gridTemplateColumns: `repeat(${selectors.length},minmax(0,1fr))` }}>
        {selectors.map((selector, index) => (
          <p className={"py-1 text-xl text-center cursor-pointer " + (index == panelState ? "border-b-2 border-black" : "")} key={selector} onClick={() => setPanelState(index)}>
            {selector}
          </p>
        ))}
      </div>
      {nodes.map((node, index) => (
        <div className={panelState == index ? "" : "hidden"} key={index}>
          {node}
        </div>
      ))}
    </>
  );
}
