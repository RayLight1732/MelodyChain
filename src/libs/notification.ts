import { Unsubscribe, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db } from "./initialize";

export class Notification {
  private _id: string;
  get id() {
    return this._id;
  }
  private _title: string;
  get title() {
    return this._title;
  }
  private _body: string;
  get body() {
    return this._body;
  }
  private _date: Date;
  get date() {
    return this._date;
  }

  private _link: string | null;
  get link() {
    return this._link;
  }

  constructor(id: string, title: string, body: string, date: Date, link: string | null) {
    this._id = id;
    this._title = title;
    this._body = body;
    this._date = date;
    this._link = link;
  }
}

function getLimit() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
}

export function subscribeNotification(observer: (notifications: Notification[]) => void): Unsubscribe {
  const q = query(collection(db, "notifications", auth.currentUser!.uid, "notifications"), where("date", ">", getLimit()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map((snapshot) => {
        const data = snapshot.data();
        return new Notification(data.id, data.title, data.body, data.date.toDate(), data.link);
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    observer(data);
  });
}

/**
 * 最後に通知を見た日時を現在の時刻に更新する
 */
export function updateLastWatchTime() {
  console.log("update time");
  return setDoc(doc(db, "notifications", auth.currentUser!.uid), { lastWatch: serverTimestamp() });
}

/**
 *
 * @returns 最後に通知を見た日時
 */
export async function getLastWatchTime(): Promise<Date | null> {
  const snapshot = await getDoc(doc(db, "notifications", auth.currentUser!.uid));
  const lastWatch = snapshot.data()?.lastWatch;
  if (lastWatch) {
    return new Date(lastWatch.toDate());
  } else {
    return null;
  }
}

export function subscribeLastWatchTime(observer: (date: Date | null) => void) {
  return onSnapshot(doc(db, "notifications", auth.currentUser!.uid), (snapshot) => {
    const date = snapshot.data({ serverTimestamps: "estimate" })?.lastWatch;
    if (date) {
      observer(new Date(date.toDate()));
    } else {
      observer(null);
    }
  });
}
