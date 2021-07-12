import { WSAvcPlayer } from "./wsavc/WSAvcPlayer";
export * from './wsavc/WSAvcPlayer';
if(typeof global !== "undefined")
    (global as any).WSAvcPlayer = WSAvcPlayer;