import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

export class Area {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

/**
 *
 * @param exportRatio 出力画像の縦に対する横の比率(横/縦)
 * @returns
 */
export function CropAreaSelector({ src, areaRef, exportRatio, rounded = false }: { src: string; areaRef: MutableRefObject<Area>; exportRatio: number; rounded: boolean }) {
  //w:h=a:b
  //w-h:h-h=c:d
  //w=w-h
  //bw=ah
  //d(w-h)=c*h-h
  //w=a/b*h
  //d*a/b*h=c*h-h
  //h-h/h=(d*a)/(b*c)=(a/b)*(d/c)
  const [ratio, setRatio] = useState(1);
  const [translate, setTranslate] = useState<Array<number>>([-50, -50]);
  const [naturalRatio, setNaturalRatio] = useState(1);
  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const firstWidthRatio = 90;
  const firstHeightRatio = 90;
  const [widthRatio, setWidthRatio] = useState(firstWidthRatio); //画面に占める横幅の割合 単位%

  const calcedWidthRatio = calcWidthRatio(ratio);
  const calcedHeightRatio = calcHeightRatio(ratio, naturalRatio, exportRatio);
  areaRef.current = new Area(
    Math.max((-1 * translate[0]!) / 100 - calcedWidthRatio / 2, 0),
    Math.max((-1 * translate[1]!) / 100 - calcedHeightRatio / 2, 0),
    Math.min(calcedWidthRatio, 1),
    Math.min(calcedHeightRatio, 1)
  );

  useEffect(() => {
    const parentContainer = parentContainerRef.current!;
    const mask = maskRef.current!;
    const resizeHandler = () => {
      let widthRatio_ = 0;
      const width = parentContainer.clientWidth;
      const height = parentContainer.clientHeight;
      if ((width * firstWidthRatio) / exportRatio > height * firstHeightRatio) {
        //高さが足りない場合
        setWidthRatio((height * firstHeightRatio * exportRatio) / width);
        widthRatio_ = (height * firstHeightRatio * exportRatio) / width;
      } else {
        if (width != firstWidthRatio) {
          setWidthRatio(firstWidthRatio);
          widthRatio_ = firstWidthRatio;
        }
      }

      /*
        mask.style.clipPath = createInvertedPath(
          25 + (100 - widthRatio_) / 4,
          50 - (mask.clientWidth * widthRatio_) / exportRatio / mask.clientHeight / 4,
          75 - (100 - widthRatio_) / 4,
          50 + (mask.clientWidth * widthRatio_) / exportRatio / mask.clientHeight / 4
        );*/
      mask.style.height = mask.clientWidth / exportRatio + "px";
    };

    const observer = new ResizeObserver((entries) => {
      resizeHandler();
    });

    if (parentContainer && mask) {
      observer.observe(parentContainer);
      observer.observe(mask);
    }
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    setTranslate([clampTranslateX(translate[0]!, ratio), clampTranslateY(translate[1]!, ratio, naturalRatio, exportRatio)]);
  }, [ratio]);

  return (
    <div className={" bg-primary z-[101] relative w-full flex-grow select-none h-full"} style={{ clipPath: "polygon(0% 0%,0% 100%,100% 100%, 100% 0%)" }} ref={parentContainerRef}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full" style={{ width: widthRatio + "%" }}>
        <div
          className={"w-full h-full z-[102] pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mask-shadow-black/60 outline " + (rounded ? "rounded-full" : "")}
          ref={maskRef}
        />

        <img
          className="top-1/2 left-1/2 absolute object-fill max-w-none max-h-none cursor-move select-none touch-none"
          draggable={false}
          src={src}
          style={{
            width: ratio * 100 + "%",
            translate: `${translate[0]}% ${translate[1]}%`,
          }}
          onLoad={(event) => {
            const imageElement = event.target as HTMLImageElement;
            const naturalRatio = imageElement.naturalWidth / imageElement.naturalHeight;
            setNaturalRatio(naturalRatio);
            setRatio(calcFirstRatio(naturalRatio, exportRatio));
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) {
              const imageElement = event.target as HTMLImageElement;
              setTranslate([
                clampTranslateX(translate[0]! + (event.movementX / imageElement.width) * 100, ratio),
                clampTranslateY(translate[1]! + (event.movementY / imageElement.height) * 100, ratio, naturalRatio, exportRatio),
              ]);
              imageElement.setPointerCapture(event.pointerId);
            }
          }}
          onWheel={(event) => {
            setRatio(Math.max(ratio + event.deltaY / 1000.0, calcFirstRatio(naturalRatio, exportRatio)));
          }}
        ></img>
      </div>
    </div>
  );
}

function clamp(min: number, value: number, max: number) {
  return Math.min(Math.max(min, value), max);
}

//最初の拡大率を計算する
//ここでいう拡大率は、画面幅(切り抜き領域)に対する画像の横幅の割合
function calcFirstRatio(naturalRatio: number, exportRatio: number) {
  if (exportRatio < naturalRatio) {
    return naturalRatio / exportRatio;
  } else {
    return 1;
  }
}

//現在の画像サイズに対する切り抜き領域の高さの占める割合を計算する
function calcHeightRatio(ratio: number, naturalRatio: number, exportRatio: number) {
  return naturalRatio / exportRatio / ratio;
}

//現在の画像サイズに対する切り抜き領域の幅の占める割合を計算する
function calcWidthRatio(ratio: number) {
  return 1 / ratio;
}

function clampTranslateX(translateX: number, ratio: number) {
  return clamp(-(100 - calcWidthRatio(ratio) * 100) / 2 - 50, translateX, (100 - calcWidthRatio(ratio) * 100) / 2 - 50);
}

function clampTranslateY(translateY: number, ratio: number, naturalRatio: number, exportRatio: number) {
  return clamp(-(100 - calcHeightRatio(ratio, naturalRatio, exportRatio) * 100) / 2 - 50, translateY, (100 - calcHeightRatio(ratio, naturalRatio, exportRatio) * 100) / 2 - 50);
}

export function cropImage(src: string, exportWidth: number, exportHeight: number, area: Area, callback: (blob: Blob | null) => void) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const iw = img.width;
    const ih = img.height;
    ctx?.drawImage(img, area.x * iw, area.y * ih, area.width * iw, area.height * ih, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      callback(blob);
    });
  };
}

export function ImageCropDialog({
  src,
  setDialogVisible,
  blobRef,
  exportWidth,
  exportHeight,
  rounded = false,
}: {
  src: string;
  setDialogVisible: Dispatch<SetStateAction<boolean>>;
  blobRef: MutableRefObject<Blob | null>;
  exportWidth: number;
  exportHeight: number;
  rounded: boolean;
}) {
  const area = useRef(new Area(0, 0, 0, 0));

  return (
    <div
      className="fixed top-0 left-0 h-screen right-0 bg-black bg-opacity-15 z-[100] flex justify-center items-center object-contain p-4"
      onClick={() => {
        setDialogVisible(false);
      }}
    >
      <div
        onClick={(event) => {
          event.stopPropagation();
        }}
        className="flex-grow h-full flex flex-col"
      >
        <div className="bg-primary flex-grow flex flex-col p-1">
          <div onClick={() => setDialogVisible(false)}>←</div>
          <CropAreaSelector src={src} areaRef={area} exportRatio={exportWidth / exportHeight} rounded={rounded}></CropAreaSelector>
          <div
            className="bg-primary"
            onClick={() => {
              cropImage(src, exportWidth, exportHeight, area.current, (blob) => {
                blobRef.current = blob;
                setDialogVisible(false);
              });
            }}
          >
            Test
          </div>
        </div>
      </div>
    </div>
  );
}
