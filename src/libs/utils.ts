import { useEffect, useState } from "react";
import { Profile } from "./profile";
import { onAuthStateChanged } from "./auth";

export const FetchStatus = Object.freeze({
  INIT: 0,
  SUCCESS: 1,
  ERROR: 2,
});

export class FetchResult<T> {
  private state: number;
  private content: T | null;

  constructor(state: number, content: T | null) {
    this.state = state;
    this.content = content;
  }

  getState() {
    return this.state;
  }

  getContent() {
    return this.content;
  }

  static getDefaultInstance<T>(): FetchResult<T> {
    return new FetchResult<T>(FetchStatus.INIT, null);
  }
}

export const HEADER_RATIO = 2.618 / 1; //横/高さ

export const DEFAULT_HEADER_WIDTH = 1500;
export const DEFAULT_PROFILE_WIDTH = 400;
export const DEFAULT_PROFILE_HEIGHT = DEFAULT_PROFILE_WIDTH;
export const DEFAULT_HEADER_HEIGHT = Math.round(DEFAULT_HEADER_WIDTH / HEADER_RATIO);
export const DEFAULT_THUMBNAIL_WIDTH = 1200;
export const DEFAULT_THUMBNAIL_HEIGHT = 900;

export function getPartArray(dram: boolean, base: boolean, guitar: boolean, melody: boolean) {
  const part = [];
  if (dram) {
    part.push(0);
  }
  if (base) {
    part.push(1);
  }
  if (guitar) {
    part.push(2);
  }
  if (melody) {
    part.push(3);
  }
  return part;
}

export function numPartToBoolPart(part: number[]): Array<boolean> {
  const result = new Array<boolean>(4);
  for (var i = 0; i < 4; i++) {
    result[i] = part.includes(i);
  }
  return result;
}

const partName = ["ドラム", "ベース", "ギター", "メロディー"];
export function indexToPartName(index: number) {
  return partName[index]!;
}

const partId = ["dram", "base", "guiter", "melody"];
export function indexToPartId(index: number) {
  return partId[index]!;
}
