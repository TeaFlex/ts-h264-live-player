import { WSAvcPlayer } from "./wsavc/WSAvcPlayer";
if(typeof window !== "undefined")
    (window as any).WSAvcPlayer = WSAvcPlayer;
export * from './wsavc/WSAvcPlayer';