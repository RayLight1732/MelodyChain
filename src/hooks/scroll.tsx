import { useRouter } from "next/router";
import { ReactNode, Ref, RefObject, createContext, useContext, useEffect, useRef } from "react";

class ScrollHistoryMap {
  private map: { [key: string]: ScrollHistory } = {};

  getOrDefault(key: string): ScrollHistory {
    var result = this.map[key];
    if (result) {
      return result;
    } else {
      result = new ScrollHistory();
      this.map[key] = result;
      return result;
    }
  }

  getOrNull(key: string): ScrollHistory | undefined {
    return this.map[key];
  }
}

class ScrollHistory {
  private scrollTop = 0;

  setScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
  }

  getScrollTop(): number {
    return this.scrollTop;
  }

  reset() {
    this.scrollTop = 0;
  }
}

const scrollHistoryContext = createContext<[ScrollHistoryMap, RefObject<HTMLDivElement> | null]>([new ScrollHistoryMap(), null]);

export function ScrollHostoryContextProvider({ children, scrollOriginRef }: { children: ReactNode; scrollOriginRef: RefObject<HTMLDivElement> }) {
  const mapRef = useRef(new ScrollHistoryMap());

  return <scrollHistoryContext.Provider value={[mapRef.current, scrollOriginRef]}>{children}</scrollHistoryContext.Provider>;
}

export function useScrollHistory(key: string, scrollRef?: RefObject<HTMLElement | null>): ScrollHistory {
  const [historyMap, scrollOriginRef] = useContext(scrollHistoryContext);
  var scrollRef_ = scrollRef ?? scrollOriginRef;
  const router = useRouter();
  useEffect(() => {
    var ignore = false;
    const handleRouteChange = () => {
      //(ページ遷移の際になぜか戻ってしまうのを防ぐ)
      ignore = true;
      console.log("on change start");
    };
    router.events.on("routeChangeStart", handleRouteChange);
    const handleScroll = () => {
      const scrollTop = scrollRef_?.current?.scrollTop;
      if (scrollTop && !ignore) {
        console.log("set scroll", scrollTop);
        historyMap.getOrDefault(key).setScrollTop(scrollTop);
      }
    };

    const element = scrollRef_?.current;
    const lastScroll = historyMap.getOrNull(key);
    if (lastScroll) {
      element?.scrollTo({ top: lastScroll.getScrollTop(), behavior: "instant" });
    }
    element?.addEventListener("scroll", handleScroll);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
      element?.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRef_?.current]);
  return historyMap.getOrDefault(key);
}
