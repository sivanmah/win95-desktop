export interface Message {
  id: string;
  content: string;
  /** ISO 8601. It crosses the wire as JSON, so it is never actually a Date. */
  timestamp: string;
  sender: string;
  nameColor: string;
}
